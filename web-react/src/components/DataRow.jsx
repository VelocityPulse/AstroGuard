import { heatCell, tCloud, tHumid, tWind, tSeeing, tTransp } from '../utils/colors.js';
import { moonIllumination } from '../utils/astronomy.js';

const THR_CLOUD = 20;
const VGAP = 5;
const CLOCKS = ['\u{1F55B}','\u{1F550}','\u{1F551}','\u{1F552}','\u{1F553}','\u{1F554}','\u{1F555}','\u{1F556}','\u{1F557}','\u{1F558}','\u{1F559}','\u{1F55A}'];

export default function DataRow({ row, isFirst, isLast, now }) {
  const { tStr, hour, night, clouds, cloudsLow, cloudsMid, cloudsHigh,
          humidity, wind, seeing, transparency } = row;

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
  // Panel corner styles for floating card blocks
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

  let scoreHtml;
  if (!night) {
    scoreHtml = <span className="score-no">{'\u00B7'}</span>;
  } else if (clouds <= THR_CLOUD) {
    scoreHtml = <span className="score-go">{'\u2705'}</span>;
  } else if (clouds <= 50) {
    scoreHtml = <span className="score-maybe">{'\u25B2'}</span>;
  } else {
    scoreHtml = <span className="score-no">{'\uD83D\uDD34'}</span>;
  }

  const moonColor = illum < 25 ? '#69f0ae' : illum < 60 ? '#ffd54f' : '#ef9a9a';
  const hourLabel = String(hour).padStart(2, '0') + 'h';

  const pad = n => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const isCurrent = tStr.slice(0, 10) === todayStr && hour === now.getHours();

  return (
    <tr className={`data-row ${night ? 'is-night' : 'is-day'}`}>
      {/* FIXED LEFT: Score, Hour */}
      <td className="score-cell">{scoreHtml}</td>
      <td className="hour">
        {hourLabel}
        {night && <span style={{ color: '#3949ab', fontSize: '.6rem' }}> {'\uD83C\uDF19'}</span>}
        {isCurrent && <span style={{ fontSize: '.6rem' }}> {CLOCKS[hour % 12]}</span>}
      </td>
      <td className="cloud-gap"></td>
      {/* TOTAL PANEL (solo) */}
      <td style={{ ...heatCell(tCloud(clouds), night), ...panelSolo }}>{clouds}%</td>
      <td className="cloud-gap"></td>
      {/* CLOUD PANEL: Bas, Moy, Haut */}
      <td style={{ ...heatCell(tCloud(cloudsLow), night), ...panelL }}>{cloudsLow}%</td>
      <td style={{ ...heatCell(tCloud(cloudsMid), night), ...panelI }}>{cloudsMid}%</td>
      <td style={{ ...heatCell(tCloud(cloudsHigh), night), ...panelR }}>{cloudsHigh}%</td>
      <td className="cloud-gap"></td>
      {/* OPENMETEO WEATHER PANEL: Humidity, Wind */}
      <td style={{ ...heatCell(tHumid(humidity), night), ...panelL }}>{humidity}%</td>
      <td style={{ ...heatCell(tWind(wind), night), ...panelR }}>{wind}</td>
      <td className="cloud-gap"></td>
      {/* SEEING/TRANSP PANEL */}
      <td style={{ ...heatCell(tSeeing(seeing), night), ...panelL }}>{seeing > 0 ? seeing + '/8' : '\u2014'}</td>
      <td style={{ ...heatCell(tTransp(transparency), night), ...panelR }}>{transparency > 0 ? transparency + '/8' : '\u2014'}</td>
      <td className="cloud-gap"></td>
      {/* MOON */}
      <td style={{ color: moonColor, background: '#090912' }}>{night ? illum + '%' : '\u2014'}</td>
    </tr>
  );
}
