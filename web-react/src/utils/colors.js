export function heatCell(t, night) {
  if (t === null) return {};
  const c = Math.max(0, Math.min(1, t));
  const hue = c < 0.5 ? c * 2 * 30 : 30 + (c - 0.5) * 2 * 90;
  const sat = 70 + c * 25;
  const lig = night ? 12 + c * 20 : 8 + c * 10;
  const textLig = 55 + c * 30;
  return {
    background: `hsl(${Math.round(hue)},${Math.round(sat)}%,${Math.round(lig)}%)`,
    color: `hsl(${Math.round(hue)},80%,${Math.round(textLig)}%)`,
  };
}

export function cloudColor(pct) {
  const t = 1 - pct / 100;
  const hue = t < 0.5 ? t * 2 * 30 : 30 + (t - 0.5) * 2 * 90;
  return `hsl(${Math.round(hue)},70%,55%)`;
}

export function tCloud(v) { return 1 - v / 100; }
export function tHumid(v) { return 1 - Math.max(0, v - 40) / 60; }
export function tWind(v) { return 1 - Math.min(v, 40) / 40; }
export function tSeeing(v) { return v > 0 ? (v - 1) / 7 : null; }
export function tTransp(v) { return v > 0 ? (v - 1) / 7 : null; }
