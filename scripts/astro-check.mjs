#!/usr/bin/env node
/**
 * astro-check.mjs — Standalone night-sky forecast summarizer
 *
 * Fetches Open-Meteo (multi-model) + 7timer for a given location,
 * computes per-night stats for the next 8 nights, outputs JSON to stdout.
 *
 * Usage:  node scripts/astro-check.mjs [--lat <lat>] [--lon <lon>] [--name <name>]
 *         node scripts/astro-check.mjs [--city <city name>]
 * Default: Rueil-Malmaison (48.8773, 2.1890)
 * No dependencies beyond Node 18+ (native fetch).
 */

// ── Re-use project modules directly ────────────────────────────────
import { fetchOpenMeteo, fetch7timer, build7timerMap } from '../web-react/src/utils/api.js';
import { buildSunMap, isNight, moonIllumination } from '../web-react/src/utils/astronomy.js';
import { val, avgNonNull, scoreWeights, weightedScore } from '../web-react/src/utils/transform.js';

// ── Parse CLI args ─────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name, fallback) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

// ── Geocoding via Nominatim ────────────────────────────────────────
async function geocode(cityName) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'astro-check/1.0' } });
  const data = await res.json();
  if (!data.length) throw new Error(`City not found: ${cityName}`);
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    name: data[0].display_name.split(',')[0].trim(),
  };
}

const cityArg = getArg('--city', null);
let LAT, LON, NAME;
if (cityArg) {
  const geo = await geocode(cityArg);
  LAT  = geo.lat;
  LON  = geo.lon;
  NAME = geo.name;
} else {
  LAT  = parseFloat(getArg('--lat',  '48.8773'));
  LON  = parseFloat(getArg('--lon',  '2.1890'));
  NAME = getArg('--name', 'Rueil-Malmaison');
}

const NIGHT_HOURS = new Set([20, 21, 22, 23, 0, 1, 2, 3, 4, 5]);

const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function nightLabel(dateStr) {
  const d = new Date(dateStr + 'T20:00:00');
  const next = new Date(d);
  next.setDate(next.getDate() + 1);
  return `${DAY_NAMES[d.getDay()]}-${DAY_NAMES[next.getDay()]}`;
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  const now = new Date();

  // Fetch APIs (resilient: null on failure)
  let meteo = null;
  let astro = null;

  try { meteo = await fetchOpenMeteo(LAT, LON); } catch (e) {
    process.stderr.write(`[WARN] Open-Meteo failed: ${e.message}\n`);
  }
  try { astro = await fetch7timer(LAT, LON); } catch (e) {
    process.stderr.write(`[WARN] 7timer failed: ${e.message}\n`);
  }

  if (!meteo) {
    // Can't do anything without Open-Meteo
    const out = { generated_at: now.toISOString().slice(0, 19), nights: [], error: 'Open-Meteo fetch failed' };
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
    process.exit(0);
  }

  // Build 7timer map (empty if astro failed)
  const smap = astro ? build7timerMap(astro) : {};

  // Parse daily sunrise/sunset
  const daily = meteo.daily || {};
  const normalizedDaily = { time: daily.time };
  if (daily.sunset) {
    normalizedDaily.sunset = daily.sunset;
    normalizedDaily.sunrise = daily.sunrise;
  } else {
    const sunsetKey = Object.keys(daily).find(k => k.startsWith('sunset_'));
    const sunriseKey = Object.keys(daily).find(k => k.startsWith('sunrise_'));
    normalizedDaily.sunset = sunsetKey ? daily[sunsetKey] : [];
    normalizedDaily.sunrise = sunriseKey ? daily[sunriseKey] : [];
  }
  const sunMap = buildSunMap(normalizedDaily);

  // Parse hourly arrays
  const h = meteo.hourly;
  const time = h.time;

  const aromeRawTotal = h['cloud_cover_meteofrance_arome_france_hd'] || null;
  const aromeLow  = h['cloud_cover_low_meteofrance_arome_france_hd'] || null;
  const aromeMid  = h['cloud_cover_mid_meteofrance_arome_france_hd'] || null;
  const aromeHigh = h['cloud_cover_high_meteofrance_arome_france_hd'] || null;
  const iconTotal = h['cloud_cover_icon_eu'] || null;
  const ecmwfTotal = h['cloud_cover_ecmwf_ifs'] || null;
  const gfsTotal = h['cloud_cover_gfs_global'] || null;
  const ecmwfHumidity = h['relative_humidity_2m_ecmwf_ifs'] || null;
  const ecmwfWind = h['wind_speed_10m_ecmwf_ifs'] || null;
  const gfsHumidity = h['relative_humidity_2m_gfs_global'] || null;
  const gfsWind = h['wind_speed_10m_gfs_global'] || null;

  // ── Bucket hourly data into nights ───────────────────────────────
  // A "night" keyed by its evening date: 2026-03-04 covers 20h Mar04 → 05h Mar05
  const nightBuckets = {};  // nightKey → { scoreClouds[], humidities[], winds[], seeings[], transparencies[], moonDates[] }

  time.forEach((tStr, i) => {
    const t = new Date(tStr);
    const hr = t.getHours();
    if (!NIGHT_HOURS.has(hr)) return;

    const calDay = tStr.slice(0, 10);
    if (!isNight(sunMap, calDay, hr)) return;

    // Determine night key (evening date)
    let nightKey;
    if (hr >= 20) {
      nightKey = calDay;
    } else {
      // hr 0-5 → belongs to previous evening
      const prev = new Date(calDay + 'T12:00:00');
      prev.setDate(prev.getDate() - 1);
      nightKey = prev.toISOString().slice(0, 10);
    }

    // Skip past nights
    const nightEvening = new Date(nightKey + 'T20:00:00');
    if (nightEvening < new Date(now.getTime() - 6 * 3600000)) return;

    if (!nightBuckets[nightKey]) {
      nightBuckets[nightKey] = {
        scoreClouds: [], humidities: [], winds: [],
        seeings: [], transparencies: [], moonDates: [],
      };
    }
    const b = nightBuckets[nightKey];

    // Weighted cloud score (same logic as transform.js)
    const aRaw = val(aromeRawTotal, i);
    const aL = val(aromeLow, i);
    const aM = val(aromeMid, i);
    const aH = val(aromeHigh, i);
    const aT = aRaw !== null ? aRaw
      : (aL !== null || aM !== null || aH !== null)
        ? Math.max(aL || 0, aM || 0, aH || 0)
        : null;
    const iT = val(iconTotal, i);
    const eT = val(ecmwfTotal, i);
    const gT = val(gfsTotal, i);
    const hoursAhead = Math.max(0, (t - now) / (1000 * 60 * 60));
    const sc = weightedScore([aT, iT, eT, gT], scoreWeights(hoursAhead));
    b.scoreClouds.push(sc);

    // Humidity & wind
    const eHum = val(ecmwfHumidity, i);
    const gHum = val(gfsHumidity, i);
    b.humidities.push(eHum !== null ? eHum : gHum);

    const eWnd = val(ecmwfWind, i);
    const gWnd = val(gfsWind, i);
    const wind = eWnd !== null ? eWnd : gWnd;
    b.winds.push(wind !== null ? Math.round(wind) : null);

    // 7timer seeing/transparency
    const key = tStr.slice(0, 13);
    const astroData = smap[key] || { seeing: null, transparency: null };
    b.seeings.push(astroData.seeing || null);
    b.transparencies.push(astroData.transparency || null);

    // Moon
    b.moonDates.push(t);
  });

  // ── Build output ─────────────────────────────────────────────────
  const nights = Object.keys(nightBuckets)
    .sort()
    .slice(0, 8)
    .map(nightKey => {
      const b = nightBuckets[nightKey];

      // % of hours with scoreCloud <= 20
      const validClouds = b.scoreClouds.filter(v => v !== null);
      const clearCount = validClouds.filter(v => v <= 20).length;
      const clearPct = validClouds.length > 0
        ? Math.round(clearCount / validClouds.length * 100)
        : null;

      // Moon illumination (use middle of the night)
      const moonPcts = b.moonDates.map(d => moonIllumination(d));
      const avgMoon = moonPcts.length > 0
        ? Math.round(moonPcts.reduce((a, b) => a + b, 0) / moonPcts.length)
        : null;

      return {
        date: nightKey,
        label: nightLabel(nightKey),
        clear_hours_pct: clearPct,
        avg_cloud: avgNonNull(b.scoreClouds),
        avg_moon_pct: avgMoon,
        avg_seeing: avgNonNull(b.seeings),
        avg_transparency: avgNonNull(b.transparencies),
        avg_humidity: avgNonNull(b.humidities),
        avg_wind_kmh: avgNonNull(b.winds),
      };
    });

  const output = {
    generated_at: now.toISOString().slice(0, 19),
    location: { name: NAME, lat: LAT, lon: LON },
    nights,
  };

  process.stdout.write(JSON.stringify(output, null, 2) + '\n');
}

main().catch(e => {
  process.stderr.write(`[FATAL] ${e.message}\n`);
  process.exit(1);
});
