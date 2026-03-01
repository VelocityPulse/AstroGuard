const KNOWN_NEW_MOON = new Date(2000, 0, 6);
const SYNODIC_MONTH = 29.53059;

export function moonIllumination(date) {
  const phase = (((date - KNOWN_NEW_MOON) / 86400000) % SYNODIC_MONTH + SYNODIC_MONTH) % SYNODIC_MONTH;
  const angle = (phase / SYNODIC_MONTH) * 2 * Math.PI;
  return Math.round((1 - Math.cos(angle)) / 2 * 100);
}

export function moonPhase(date) {
  const phase = (((date - KNOWN_NEW_MOON) / 86400000) % SYNODIC_MONTH + SYNODIC_MONTH) % SYNODIC_MONTH;
  const emojis = ['\u{1F311}', '\u{1F312}', '\u{1F313}', '\u{1F314}', '\u{1F315}', '\u{1F316}', '\u{1F317}', '\u{1F318}'];
  const pct = Math.round((phase / SYNODIC_MONTH) * 100);
  return { emoji: emojis[Math.round(phase / SYNODIC_MONTH * 7) % 8], pct };
}

export function buildSunMap(dailyData) {
  const sunMap = {};
  if (!dailyData) return sunMap;
  dailyData.time.forEach((day, i) => {
    const ss = new Date(dailyData.sunset[i]);
    const sr = new Date(dailyData.sunrise[i]);
    sunMap[day] = {
      sunset: ss.getHours() + ss.getMinutes() / 60,
      sunrise: sr.getHours() + sr.getMinutes() / 60,
    };
  });
  return sunMap;
}

export function isNight(sunMap, day, hour) {
  const sun = sunMap[day];
  if (!sun) return hour >= 20 || hour <= 5;
  return hour >= Math.ceil(sun.sunset) || hour < Math.floor(sun.sunrise);
}
