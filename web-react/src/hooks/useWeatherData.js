import { useState, useEffect } from 'react';
import { fetchOpenMeteo, fetch7timer, build7timerMap } from '../utils/api.js';
import { buildSunMap, isNight } from '../utils/astronomy.js';
import { MODELS } from '../utils/models.js';

/* ── helpers ─────────────────────────────────────────────────────── */

/** Safely read a value from the hourly response; returns null if missing or null */
function val(arr, i) {
  if (!arr || arr.length <= i) return null;
  const v = arr[i];
  return v === null || v === undefined ? null : v;
}

/** Average non-null values.  Returns null if all values are null. */
function avgNonNull(values) {
  const valid = values.filter((v) => v !== null && v !== undefined);
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

/** Relevance weights per model by forecast horizon (hours ahead).
 *  Higher = more trusted at this range. */
function scoreWeights(hoursAhead) {
  //                         AROME  ICON  ECMWF  GFS
  if (hoursAhead <= 48)  return [5, 2, 2, 1];   // J→J+2  : AROME domine
  if (hoursAhead <= 120) return [0, 3, 3, 1];   // J+2→J+5: ICON + ECMWF
  if (hoursAhead <= 240) return [0, 0, 3, 2];   // J+5→J+10: ECMWF + GFS
  return                        [0, 0, 1, 3];   // J+10+  : GFS domine
}

/** Weighted average of cloud values by model relevance. */
function weightedScore(values, weights) {
  let sum = 0, wSum = 0;
  for (let k = 0; k < values.length; k++) {
    if (values[k] !== null && weights[k] > 0) {
      sum += values[k] * weights[k];
      wSum += weights[k];
    }
  }
  return wSum > 0 ? Math.round(sum / wSum) : null;
}

/* ── aggregation blocks (for J+5 .. J+16) ────────────────────── */

const AGG_BLOCKS = [
  { label: '21-0h', hours: [21, 22, 23] },
  { label: '0-4h',  hours: [0, 1, 2, 3] },
  { label: '4-6h',  hours: [4, 5] },
  // Day hours are bucketed generically
  { label: '6-9h',  hours: [6, 7, 8] },
  { label: '9-12h', hours: [9, 10, 11] },
  { label: '12-15h', hours: [12, 13, 14] },
  { label: '15-18h', hours: [15, 16, 17] },
  { label: '18-21h', hours: [18, 19, 20] },
];

function aggregateRows(hourlyRows, sunMap) {
  const aggregated = [];
  for (const block of AGG_BLOCKS) {
    const matching = hourlyRows.filter((r) => block.hours.includes(r.hour));
    if (matching.length === 0) continue;

    // Use the first row's day for night determination
    const refRow = matching[0];
    const night = matching.some((r) => r.night);

    aggregated.push({
      tStr: refRow.tStr,
      day: refRow.day,
      hour: refRow.hour,
      isAggregated: true,
      blockLabel: block.label,
      night,

      scoreCloud: avgNonNull(matching.map((r) => r.scoreCloud)),

      aromeTotal: avgNonNull(matching.map((r) => r.aromeTotal)),

      iconLow:  avgNonNull(matching.map((r) => r.iconLow)),
      iconMid:  avgNonNull(matching.map((r) => r.iconMid)),
      iconHigh: avgNonNull(matching.map((r) => r.iconHigh)),

      ecmwfLow:  avgNonNull(matching.map((r) => r.ecmwfLow)),
      ecmwfMid:  avgNonNull(matching.map((r) => r.ecmwfMid)),
      ecmwfHigh: avgNonNull(matching.map((r) => r.ecmwfHigh)),

      gfsLow:  avgNonNull(matching.map((r) => r.gfsLow)),
      gfsMid:  avgNonNull(matching.map((r) => r.gfsMid)),
      gfsHigh: avgNonNull(matching.map((r) => r.gfsHigh)),

      humidity: avgNonNull(matching.map((r) => r.humidity)),
      wind:     avgNonNull(matching.map((r) => r.wind)),

      seeing:       avgNonNull(matching.map((r) => r.seeing)),
      transparency: avgNonNull(matching.map((r) => r.transparency)),
    });
  }
  return aggregated;
}

/* ── main hook ───────────────────────────────────────────────── */

export function useWeatherData(lat, lon) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Reuse prefetched promises if coordinates match
    const pf = window.__PREFETCH__;
    const meteoP = (pf && pf.lat === lat && pf.lon === lon) ? pf.meteo : fetchOpenMeteo(lat, lon);
    const astroP = (pf && pf.lat === lat && pf.lon === lon) ? pf.astro : fetch7timer(lat, lon);
    if (pf) window.__PREFETCH__ = null;

    Promise.all([meteoP, astroP])
      .then(([meteo, astro]) => {
        if (cancelled) return;

        const smap = build7timerMap(astro);

        // Normalize daily data: multi-model response prefixes sunset/sunrise
        // with model names. Pick the first available set.
        const daily = meteo.daily || {};
        const normalizedDaily = { time: daily.time };
        if (daily.sunset) {
          normalizedDaily.sunset = daily.sunset;
          normalizedDaily.sunrise = daily.sunrise;
        } else {
          // Find prefixed keys
          const sunsetKey = Object.keys(daily).find((k) => k.startsWith('sunset_'));
          const sunriseKey = Object.keys(daily).find((k) => k.startsWith('sunrise_'));
          normalizedDaily.sunset = sunsetKey ? daily[sunsetKey] : [];
          normalizedDaily.sunrise = sunriseKey ? daily[sunriseKey] : [];
        }

        const sunMap = buildSunMap(normalizedDaily);
        const h = meteo.hourly;
        const time = h.time;

        /* ── extract per-model arrays from the API response ── */
        const aromeLow  = h['cloud_cover_low_meteofrance_arome_france_hd'] || null;
        const aromeMid  = h['cloud_cover_mid_meteofrance_arome_france_hd'] || null;
        const aromeHigh = h['cloud_cover_high_meteofrance_arome_france_hd'] || null;
        // The forecast multi-model endpoint returns null for AROME total;
        // compute it from max(low, mid, high) as a fallback.
        const aromeRawTotal = h['cloud_cover_meteofrance_arome_france_hd'] || null;

        const iconTotal = h['cloud_cover_icon_eu'] || null;
        const iconLow   = h['cloud_cover_low_icon_eu'] || null;
        const iconMid   = h['cloud_cover_mid_icon_eu'] || null;
        const iconHigh  = h['cloud_cover_high_icon_eu'] || null;

        const ecmwfTotal = h['cloud_cover_ecmwf_ifs'] || null;
        const ecmwfLow   = h['cloud_cover_low_ecmwf_ifs'] || null;
        const ecmwfMid   = h['cloud_cover_mid_ecmwf_ifs'] || null;
        const ecmwfHigh  = h['cloud_cover_high_ecmwf_ifs'] || null;

        const gfsTotal = h['cloud_cover_gfs_global'] || null;
        const gfsLow   = h['cloud_cover_low_gfs_global'] || null;
        const gfsMid   = h['cloud_cover_mid_gfs_global'] || null;
        const gfsHigh  = h['cloud_cover_high_gfs_global'] || null;

        const ecmwfHumidity = h['relative_humidity_2m_ecmwf_ifs'] || null;
        const ecmwfWind     = h['wind_speed_10m_ecmwf_ifs'] || null;
        const gfsHumidity   = h['relative_humidity_2m_gfs_global'] || null;
        const gfsWind       = h['wind_speed_10m_gfs_global'] || null;

        /* ── determine the first timestamp for J+N offset ── */
        const t0 = new Date(time[0]);
        const fetchTime = new Date();

        /* ── Build hourly rows ── */
        const rows = time.map((tStr, i) => {
          const t = new Date(tStr);
          const day = tStr.slice(0, 10);
          const hr = t.getHours();
          const night = isNight(sunMap, day, hr);
          const key = tStr.slice(0, 13);
          const astroData = smap[key] || { seeing: 0, transparency: 0 };

          // AROME total: use raw if available, else max(low, mid, high)
          const aRaw = val(aromeRawTotal, i);
          const aL = val(aromeLow, i);
          const aM = val(aromeMid, i);
          const aH = val(aromeHigh, i);
          const aT = aRaw !== null ? aRaw
            : (aL !== null || aM !== null || aH !== null)
              ? Math.max(aL || 0, aM || 0, aH || 0)
              : null;

          const iL = val(iconLow, i);
          const iM = val(iconMid, i);
          const iH = val(iconHigh, i);

          const eL = val(ecmwfLow, i);
          const eM = val(ecmwfMid, i);
          const eH = val(ecmwfHigh, i);
          const eT = val(ecmwfTotal, i);

          const gL = val(gfsLow, i);
          const gM = val(gfsMid, i);
          const gH = val(gfsHigh, i);
          const gT = val(gfsTotal, i);

          // Score: weighted average by model relevance at this horizon
          const iT = val(iconTotal, i);
          const hoursAhead = Math.max(0, (t - fetchTime) / (1000 * 60 * 60));
          const scoreCloud = weightedScore([aT, iT, eT, gT], scoreWeights(hoursAhead));

          // Humidity & wind: ECMWF preferred, fallback GFS
          const eHum = val(ecmwfHumidity, i);
          const eWnd = val(ecmwfWind, i);
          const gHum = val(gfsHumidity, i);
          const gWnd = val(gfsWind, i);
          const humidity = eHum !== null ? eHum : gHum;
          const windRaw = eWnd !== null ? eWnd : gWnd;
          const wind = windRaw !== null ? Math.round(windRaw) : null;

          return {
            tStr,
            day,
            hour: hr,
            isAggregated: false,
            blockLabel: null,
            night,

            scoreCloud,

            aromeTotal: aT,

            iconLow: iL,
            iconMid: iM,
            iconHigh: iH,

            ecmwfLow: eL,
            ecmwfMid: eM,
            ecmwfHigh: eH,

            gfsLow: gL,
            gfsMid: gM,
            gfsHigh: gH,

            humidity,
            wind,

            seeing: astroData.seeing,
            transparency: astroData.transparency,
          };
        });

        /* ── Night stats ── */
        const nightStats = {};
        const maxMs = 11 * 24 * 60 * 60 * 1000; // J+11 limit
        time.forEach((tStr, i) => {
          const t = new Date(tStr);
          if (t - fetchTime > maxMs) return; // skip beyond J+11
          const hr = t.getHours();
          const calDay = tStr.slice(0, 10);
          if (!isNight(sunMap, calDay, hr)) return;

          let nightKey;
          const sun = sunMap[calDay];
          if (sun && hr < Math.floor(sun.sunrise)) {
            const prev = new Date(calDay + 'T12:00:00');
            prev.setDate(prev.getDate() - 1);
            nightKey = prev.toISOString().slice(0, 10);
          } else {
            nightKey = calDay;
          }

          if (!nightStats[nightKey]) {
            nightStats[nightKey] = { total: 0, sumClouds: 0, sumL: 0, sumM: 0, sumH: 0 };
          }
          const s = nightStats[nightKey];
          s.total++;

          // Cloud total: weighted average (same logic as scoreCloud)
          const aRaw2 = val(aromeRawTotal, i);
          const aL2 = val(aromeLow, i);
          const aM2 = val(aromeMid, i);
          const aH2 = val(aromeHigh, i);
          const aT = aRaw2 !== null ? aRaw2
            : (aL2 !== null || aM2 !== null || aH2 !== null)
              ? Math.max(aL2 || 0, aM2 || 0, aH2 || 0)
              : null;
          const iT = val(iconTotal, i);
          const eT = val(ecmwfTotal, i);
          const gT = val(gfsTotal, i);
          const hoursAhead = Math.max(0, (t - fetchTime) / (1000 * 60 * 60));
          const cloudVal = weightedScore([aT, iT, eT, gT], scoreWeights(hoursAhead));
          s.sumClouds += cloudVal !== null ? cloudVal : 0;

          // Layers: weighted average per layer
          const w = scoreWeights(hoursAhead);
          const iL = val(iconLow, i);
          const iM = val(iconMid, i);
          const iH = val(iconHigh, i);
          const eL = val(ecmwfLow, i);
          const eM = val(ecmwfMid, i);
          const eH = val(ecmwfHigh, i);
          const gL = val(gfsLow, i);
          const gM = val(gfsMid, i);
          const gH = val(gfsHigh, i);
          // AROME has no layers, use weight 0 for layer averages
          const layerW = [0, w[1], w[2], w[3]];
          s.sumL += weightedScore([null, iL, eL, gL], layerW) || 0;
          s.sumM += weightedScore([null, iM, eM, gM], layerW) || 0;
          s.sumH += weightedScore([null, iH, eH, gH], layerW) || 0;
        });

        /* ── Group rows by day, apply aggregation for J+5+ ── */
        const dayMap = {};
        rows.forEach((row) => {
          if (!dayMap[row.day]) dayMap[row.day] = [];
          dayMap[row.day].push(row);
        });

        const sortedDays = Object.keys(dayMap).sort();
        const dayGroups = [];

        sortedDays.forEach((day) => {
          const dayDate = new Date(day + 'T12:00:00');
          const diffMs = dayDate - t0;
          const diffDays = diffMs / (1000 * 60 * 60 * 24);

          // Skip days beyond J+11
          if (diffDays > 11) return;

          let finalRows;
          if (diffDays >= 5) {
            // Aggregate into 3-4h blocks
            finalRows = aggregateRows(dayMap[day], sunMap);
          } else {
            finalRows = dayMap[day];
          }

          if (finalRows.length > 0) {
            dayGroups.push({ day, rows: finalRows });
          }
        });

        setData({ dayGroups, nightStats, sunMap });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [lat, lon]);

  return { data, loading, error };
}
