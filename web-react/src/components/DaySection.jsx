import { forwardRef } from 'react';
import DataRow from './DataRow.jsx';

const SUB_HEADERS = [
  { label: '\u2713', sep: false },
  { label: 'H', sep: false },
  { label: '', spacer: true },
  { label: 'Total', sep: false },
  { label: '', spacer: true },
  { label: 'Bas', sep: false },
  { label: 'Moy', sep: false },
  { label: 'Haut', sep: false },
  { label: '', spacer: true },
  { label: 'Humidit\u00E9', sep: false },
  { label: 'Vent', sep: false },
  { label: '', spacer: true },
  { label: 'Seeing', sep: false },
  { label: 'Transp.', sep: false },
  { label: '\uD83C\uDF19', sep: false },
];

function buildDayLabel(day) {
  const t = new Date(day + 'T12:00:00');
  const prev = new Date(t);
  prev.setDate(prev.getDate() - 1);
  const wdPrev = prev.toLocaleDateString('fr-FR', { weekday: 'long' });
  const wdCurr = t.toLocaleDateString('fr-FR', { weekday: 'long' });
  const datePart = t.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${wdPrev}-${wdCurr} ${datePart}`;
}

const DaySection = forwardRef(function DaySection({ day, rows }, ref) {
  return (
    <>
      <tr className="day-header" data-day={day} id={`day-${day}`} ref={ref}>
        <td colSpan={15}>{'\uD83D\uDCC5'} {buildDayLabel(day)}</td>
      </tr>
      <tr className="sub-header">
        {SUB_HEADERS.map((h, i) => (
          <td key={i} className={h.spacer ? 'cloud-gap' : (h.sep ? 'sep' : '')}
              style={i === 0 ? { textAlign: 'left', paddingLeft: 10 } : undefined}>
            {h.label}
          </td>
        ))}
      </tr>
      <tr className="source-header">
        <td></td>
        <td></td>
        <td className="cloud-gap"></td>
        <td></td>
        <td className="cloud-gap"></td>
        <td colSpan={3}>OpenMeteo</td>
        <td className="cloud-gap"></td>
        <td colSpan={2}>OpenMeteo</td>
        <td className="cloud-gap"></td>
        <td colSpan={2}>7Timer</td>
        <td></td>
      </tr>
      {rows.map((row, i) => (
        <DataRow key={row.tStr} row={row} isFirst={i === 0} isLast={i === rows.length - 1} />
      ))}
    </>
  );
});

export default DaySection;
