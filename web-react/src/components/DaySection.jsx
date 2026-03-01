import { forwardRef } from 'react';
import DataRow from './DataRow.jsx';
import { MODELS, SEVEN_TIMER } from '../utils/models.js';

const TOTAL_COLS = 25;

function buildDayLabel(day, now) {
  const t = new Date(day + 'T12:00:00');
  const prev = new Date(t);
  prev.setDate(prev.getDate() - 1);
  const wdPrev = prev.toLocaleDateString('fr-FR', { weekday: 'long' });
  const wdCurr = t.toLocaleDateString('fr-FR', { weekday: 'long' });
  const datePart = t.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const diff = Math.round((t - today) / (1000 * 60 * 60 * 24));
  const jLabel = diff === 0 ? 'J' : `J+${diff}`;
  return `${wdPrev}-${wdCurr} ${datePart} (${jLabel})`;
}

/** Build the source-header info block for a model */
function SourceCell({ model, hoursFromStart }) {
  const isInterpolated =
    model.interpolatedAfterH !== null && hoursFromStart > model.interpolatedAfterH;

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0, lineHeight: 1.3 }}>
      <span style={{ fontWeight: 700 }}>{model.label}</span>
      <span>{model.resolution}</span>
      <span>{model.range}</span>
      <span>{model.updateFreq}</span>
      {isInterpolated && (
        <span style={{ color: '#ffd54f', fontWeight: 600 }}>{'\u26A0'} interpol{'\u00E9'}</span>
      )}
    </span>
  );
}

function SevenTimerCell() {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0, lineHeight: 1.3 }}>
      <span style={{ fontWeight: 700 }}>{SEVEN_TIMER.label}</span>
      <span>{SEVEN_TIMER.resolution}</span>
      <span>{SEVEN_TIMER.range}</span>
      <span>{SEVEN_TIMER.updateFreq}</span>
    </span>
  );
}

function TotalCell() {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0, lineHeight: 1.3 }}>
      <span style={{ fontWeight: 700 }}>Synth{'\u00E8'}se</span>
      <span>Meilleur</span>
      <span>mod{'\u00E8'}le</span>
    </span>
  );
}

const DaySection = forwardRef(function DaySection({ day, rows, now }, ref) {
  /* Compute hours from the "now" reference for interpolation warnings.
     We use the start of the day as an approximation. */
  const dayStart = new Date(day + 'T00:00:00');
  const hoursFromNow = Math.max(0, (dayStart - now) / (1000 * 60 * 60));

  return (
    <>
      {/* Day header */}
      <tr className="day-header" data-day={day} id={`day-${day}`} ref={ref}>
        <td colSpan={TOTAL_COLS}>{'\uD83D\uDCC5'} {buildDayLabel(day, now)}</td>
      </tr>

      {/* Source info block */}
      <tr className="source-header">
        {/* Score (1 col) */}
        <td></td>
        {/* Total synthesis (1 col) */}
        <td style={{ verticalAlign: 'top' }}>
          <TotalCell />
        </td>
        {/* Hour (1 col) */}
        <td></td>
        <td className="cloud-gap"></td>
        {/* AROME (1 col) */}
        <td style={{ verticalAlign: 'top' }}>
          <SourceCell model={MODELS[0]} hoursFromStart={hoursFromNow} />
        </td>
        <td className="cloud-gap"></td>
        {/* ICON-EU (3 cols) */}
        <td colSpan={3} style={{ verticalAlign: 'top' }}>
          <SourceCell model={MODELS[1]} hoursFromStart={hoursFromNow} />
        </td>
        <td className="cloud-gap"></td>
        {/* ECMWF (3 cols) */}
        <td colSpan={3} style={{ verticalAlign: 'top' }}>
          <SourceCell model={MODELS[2]} hoursFromStart={hoursFromNow} />
        </td>
        <td className="cloud-gap"></td>
        {/* GFS (3 cols) */}
        <td colSpan={3} style={{ verticalAlign: 'top' }}>
          <SourceCell model={MODELS[3]} hoursFromStart={hoursFromNow} />
        </td>
        <td className="cloud-gap"></td>
        {/* Humid + Vent (2 cols) */}
        <td colSpan={2}></td>
        <td className="cloud-gap"></td>
        {/* Seeing + Transp (2 cols) */}
        <td colSpan={2} style={{ verticalAlign: 'top' }}>
          <SevenTimerCell />
        </td>
        <td className="cloud-gap"></td>
        {/* Moon (1 col) */}
        <td></td>
      </tr>

      {/* Data rows */}
      {rows.map((row, i) => (
        <DataRow key={row.tStr + (row.blockLabel || '')} row={row} isFirst={i === 0} isLast={i === rows.length - 1} now={now} />
      ))}
    </>
  );
});

export default DaySection;
