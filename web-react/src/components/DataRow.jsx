import { heatCell, tCloud, tHumid, tWind, tSeeing, tTransp } from '../utils/colors.js';
import { moonIllumination } from '../utils/astronomy.js';

const THR_CLOUD = 20;
const VGAP = 5;
const CLOCKS = ['\u{1F55B}','\u{1F550}','\u{1F551}','\u{1F552}','\u{1F553}','\u{1F554}','\u{1F555}','\u{1F556}','\u{1F557}','\u{1F558}','\u{1F559}','\u{1F55A}'];

/** Render a cloud-cover cell. null/undefined → "—" */
function cloudCell(value, night, panelStyle) {
  if (value === null || value === undefined) {
    return (
      <td style={{ color: '#546e7a', background: '#090912', ...panelStyle }}>
        {'\u2014'}
      </td>
    );
  }
  return (
    <td style={{ ...heatCell(tCloud(value), night), ...panelStyle }}>
      {value}%
    </td>
  );
}

/** Render a weather cell (humidity / wind). null → "—" */
function weatherCell(value, tFn, suffix, night, panelStyle) {
  if (value === null || value === undefined) {
    return (
      <td style={{ color: '#546e7a', background: '#090912', ...panelStyle }}>
        {'\u2014'}
      </td>
    );
  }
  return (
    <td style={{ ...heatCell(tFn(value), night), ...panelStyle }}>
      {value}{suffix}
    </td>
  );
}

export default function DataRow({ row, isFirst, isLast, now }) {
  const {
    tStr, hour, night, isAggregated, blockLabel,
    scoreCloud,
    aromeTotal,
    iconLow, iconMid, iconHigh,
    ecmwfLow, ecmwfMid, ecmwfHigh,
    gfsLow, gfsMid, gfsHigh,
    humidity, wind,
    seeing, transparency,
  } = row;

  const t = new Date(tStr);
  const illum = moonIllumination(t);

  // Vertical gap via inset box-shadow + border-radius on panel edge cells
  const shadows = [];
  if (isFirst) shadows.push(`inset 0 ${VGAP}px 0 0 #0d0d18`);
  if (isLast) shadows.push(`inset 0 -${VGAP}px 0 0 #0d0d18`);
  const vgap = {
    ...(shadows.length && { boxShadow: shadows.join(', ') }),
    ...(isLast && { borderBottom: 'none' }),
  };

  const R = 6;
  const panelL = {
    ...vgap,
    ...(isFirst && { borderTopLeftRadius: R }),
    ...(isLast && { borderBottomLeftRadius: R }),
  };
  const panelR = {
    ...vgap,
    ...(isFirst && { borderTopRightRadius: R }),
    ...(isLast && { borderBottomRightRadius: R }),
  };
  const panelI = { ...vgap };
  const panelSolo = {
    ...vgap,
    ...(isFirst && { borderTopLeftRadius: R, borderTopRightRadius: R }),
    ...(isLast && { borderBottomLeftRadius: R, borderBottomRightRadius: R }),
  };

  // Score
  let scoreHtml;
  if (!night) {
    scoreHtml = <span className="score-no">{'\u00B7'}</span>;
  } else if (scoreCloud === null || scoreCloud === undefined) {
    scoreHtml = <span className="score-no">{'\u2014'}</span>;
  } else if (scoreCloud <= THR_CLOUD) {
    scoreHtml = <span className="score-go">{'\u2705'}</span>;
  } else if (scoreCloud <= 50) {
    scoreHtml = <span className="score-maybe">{'\u25B2'}</span>;
  } else {
    scoreHtml = <span className="score-no">{'\uD83D\uDD34'}</span>;
  }

  const moonColor = illum < 25 ? '#69f0ae' : illum < 60 ? '#ffd54f' : '#ef9a9a';

  // Hour label
  const hourLabel = isAggregated ? blockLabel : String(hour).padStart(2, '0') + 'h';

  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const isCurrent = !isAggregated && tStr.slice(0, 10) === todayStr && hour === now.getHours();

  const rowClass = `data-row ${night ? 'is-night' : 'is-day'}${isAggregated ? ' is-aggregated' : ''}`;

  return (
    <tr className={rowClass}>
      {/* Score */}
      <td className="score-cell">{scoreHtml}</td>

      {/* Total (synthesis) */}
      {cloudCell(scoreCloud, night, panelSolo)}

      {/* Hour */}
      <td className="hour" style={isAggregated ? { fontSize: '0.75rem' } : undefined}>
        {hourLabel}
        {night && !isAggregated && <span style={{ color: '#3949ab', fontSize: '.6rem' }}> {'\uD83C\uDF19'}</span>}
        {isCurrent && <span style={{ fontSize: '.6rem' }}> {CLOCKS[hour % 12]}</span>}
      </td>
      <td className="cloud-gap"></td>

      {/* AROME — total only (panelSolo) */}
      {cloudCell(aromeTotal, night, panelSolo)}
      <td className="cloud-gap"></td>

      {/* ICON-EU — B M H (panelL, panelI, panelR) */}
      {cloudCell(iconLow, night, panelL)}
      {cloudCell(iconMid, night, panelI)}
      {cloudCell(iconHigh, night, panelR)}
      <td className="cloud-gap"></td>

      {/* ECMWF — B M H */}
      {cloudCell(ecmwfLow, night, panelL)}
      {cloudCell(ecmwfMid, night, panelI)}
      {cloudCell(ecmwfHigh, night, panelR)}
      <td className="cloud-gap"></td>

      {/* GFS — B M H */}
      {cloudCell(gfsLow, night, panelL)}
      {cloudCell(gfsMid, night, panelI)}
      {cloudCell(gfsHigh, night, panelR)}
      <td className="cloud-gap"></td>

      {/* Humidity & Wind */}
      {weatherCell(humidity, tHumid, '%', night, panelL)}
      {weatherCell(wind, tWind, '', night, panelR)}
      <td className="cloud-gap"></td>

      {/* Seeing & Transparency */}
      <td style={{ ...heatCell(tSeeing(seeing), night), ...panelL }}>
        {seeing > 0 ? seeing + '/8' : '\u2014'}
      </td>
      <td style={{ ...heatCell(tTransp(transparency), night), ...panelR }}>
        {transparency > 0 ? transparency + '/8' : '\u2014'}
      </td>
      <td className="cloud-gap"></td>

      {/* Moon */}
      <td style={{ color: moonColor, background: '#090912' }}>
        {night ? illum + '%' : '\u2014'}
      </td>
    </tr>
  );
}
