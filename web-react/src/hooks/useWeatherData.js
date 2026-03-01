import { useState, useEffect } from 'react';
import { fetchOpenMeteo, fetch7timer, build7timerMap } from '../utils/api.js';
import { buildSunMap, isNight } from '../utils/astronomy.js';

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
    if (pf) window.__PREFETCH__ = null; // use only once

    Promise.all([meteoP, astroP])
      .then(([meteo, astro]) => {
        if (cancelled) return;

        const smap = build7timerMap(astro);
        const sunMap = buildSunMap(meteo.daily);

        const { time, cloudcover, cloudcover_low, cloudcover_mid, cloudcover_high,
                relativehumidity_2m, windspeed_10m } = meteo.hourly;

        // Build rows
        const rows = time.map((tStr, i) => {
          const t = new Date(tStr);
          const day = tStr.slice(0, 10);
          const hr = t.getHours();
          const night = isNight(sunMap, day, hr);
          const key = tStr.slice(0, 13);
          const astroData = smap[key] || { seeing: 0, transparency: 0 };

          return {
            tStr,
            day,
            hour: hr,
            night,
            clouds: cloudcover[i],
            cloudsLow: cloudcover_low[i],
            cloudsMid: cloudcover_mid[i],
            cloudsHigh: cloudcover_high[i],
            humidity: relativehumidity_2m[i],
            wind: Math.round(windspeed_10m[i]),
            seeing: astroData.seeing,
            transparency: astroData.transparency,
          };
        });

        // Night stats
        const nightStats = {};
        time.forEach((tStr, i) => {
          const t = new Date(tStr);
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
          s.sumClouds += cloudcover[i];
          s.sumL += cloudcover_low[i];
          s.sumM += cloudcover_mid[i];
          s.sumH += cloudcover_high[i];
        });

        // Group rows by day
        const dayGroups = [];
        let currentDay = null;
        let currentRows = [];
        rows.forEach((row) => {
          if (row.day !== currentDay) {
            if (currentDay !== null) {
              dayGroups.push({ day: currentDay, rows: currentRows });
            }
            currentDay = row.day;
            currentRows = [];
          }
          currentRows.push(row);
        });
        if (currentDay !== null) {
          dayGroups.push({ day: currentDay, rows: currentRows });
        }

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
