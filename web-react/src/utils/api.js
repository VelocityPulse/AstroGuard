export async function fetchOpenMeteo(lat, lon) {
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + `&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,relative_humidity_2m,wind_speed_10m`
    + `&daily=sunset,sunrise&timezone=Europe/Paris&forecast_days=16&past_days=1`
    + `&models=meteofrance_arome_france_hd,icon_eu,ecmwf_ifs,gfs_global`
  );
  return r.json();
}

export async function fetch7timer(lat, lon) {
  const r = await fetch(
    `https://www.7timer.info/bin/api.pl?lon=${lon}&lat=${lat}&product=astro&output=json`
  );
  return r.json();
}

export function build7timerMap(astro) {
  const map = {};
  const s = astro.init;
  const init = new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), +s.slice(8, 10)));
  astro.dataseries.forEach((e, i) => {
    for (let h = 0; h < 3; h++) {
      const tt = new Date(init.getTime() + (i * 3 + h) * 3600000);
      map[tt.toISOString().slice(0, 13)] = {
        seeing: e.seeing || 0,
        transparency: e.transparency || 0,
      };
    }
  });
  return map;
}
