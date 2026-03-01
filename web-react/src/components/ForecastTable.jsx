import { useRef, useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import DaySection from './DaySection.jsx';
import { useScrollSpy } from '../hooks/useScrollSpy.js';

const Table = styled.table`
  border-collapse: separate;
  border-spacing: 0;
  width: fit-content;
`;

/*
 * 24-column layout (6 spacers, 18 data columns):
 *
 *  0  Score ✓
 *  1  H (hour)
 *  2  spacer
 *  3  AROME total
 *  4  spacer
 *  5  ICON-EU B
 *  6  ICON-EU M
 *  7  ICON-EU H
 *  8  spacer
 *  9  ECMWF B
 * 10  ECMWF M
 * 11  ECMWF H
 * 12  spacer
 * 13  GFS B
 * 14  GFS M
 * 15  GFS H
 * 16  spacer
 * 17  Humid.
 * 18  Vent
 * 19  spacer
 * 20  Seeing
 * 21  Transp.
 * 22  spacer
 * 23  Moon
 */

/* ---------- Row 1: group titles with colspan ---------- */

const GROUP_HEADERS = [
  { label: '\u2713', colSpan: 1 },            // 0
  { label: 'H', colSpan: 1 },                 // 1
  { spacer: true },                            // 2
  { label: 'AROME', colSpan: 1 },             // 3
  { spacer: true },                            // 4
  { label: 'ICON-EU', colSpan: 3 },           // 5-6-7
  { spacer: true },                            // 8
  { label: 'ECMWF', colSpan: 3 },             // 9-10-11
  { spacer: true },                            // 12
  { label: 'GFS', colSpan: 3 },               // 13-14-15
  { spacer: true },                            // 16
  { label: '', colSpan: 2 },                   // 17-18 (Humid/Wind — no title)
  { spacer: true },                            // 19
  { label: '', colSpan: 2 },                   // 20-21 (Seeing/Transp — no title)
  { spacer: true },                            // 22
  { label: '\uD83C\uDF19', colSpan: 1 },      // 23
];

/* ---------- Row 2: sub-column labels ---------- */

const SUB_HEADERS = [
  { label: '\u2713' },           // 0
  { label: 'H' },               // 1
  { spacer: true },              // 2
  { label: 'Total' },           // 3  AROME
  { spacer: true },              // 4
  { label: 'B' },               // 5  ICON-EU
  { label: 'M' },               // 6
  { label: 'H' },               // 7
  { spacer: true },              // 8
  { label: 'B' },               // 9  ECMWF
  { label: 'M' },               // 10
  { label: 'H' },               // 11
  { spacer: true },              // 12
  { label: 'B' },               // 13 GFS
  { label: 'M' },               // 14
  { label: 'H' },               // 15
  { spacer: true },              // 16
  { label: 'Humid.' },          // 17
  { label: 'Vent' },            // 18
  { spacer: true },              // 19
  { label: 'Seeing' },          // 20
  { label: 'Transp.' },         // 21
  { spacer: true },              // 22
  { label: '\uD83C\uDF19' },    // 23
];

export default function ForecastTable({ dayGroups, onActiveDayChange }) {
  const dayRefs = useRef({});
  const activeDay = useScrollSpy(dayRefs, [dayGroups]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (activeDay) onActiveDayChange(activeDay);
  }, [activeDay, onActiveDayChange]);

  const setDayRef = useCallback((day) => (el) => {
    dayRefs.current[day] = el;
  }, []);

  return (
    <div className="main" style={{ overflowX: 'auto' }}>
      <Table>
        <thead>
          {/* Row 1: group titles */}
          <tr>
            {GROUP_HEADERS.map((g, i) => (
              <th
                key={i}
                className={g.spacer ? 'cloud-gap' : ''}
                colSpan={g.colSpan || 1}
                style={i === 0 ? { textAlign: 'left', paddingLeft: 10 } : undefined}
              >
                {g.spacer ? '' : g.label}
              </th>
            ))}
          </tr>
          {/* Row 2: sub-column labels */}
          <tr>
            {SUB_HEADERS.map((h, i) => (
              <th
                key={i}
                className={h.spacer ? 'cloud-gap' : ''}
                style={{
                  ...(i === 0 ? { textAlign: 'left', paddingLeft: 10 } : {}),
                  fontSize: '0.6rem',
                  borderBottom: '1px solid #1a1a2e',
                  borderTop: 'none',
                  paddingTop: 2,
                  paddingBottom: 3,
                }}
              >
                {h.spacer ? '' : h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dayGroups.map(({ day, rows }) => (
            <DaySection key={day} day={day} rows={rows} now={now} ref={setDayRef(day)} />
          ))}
        </tbody>
      </Table>
    </div>
  );
}
