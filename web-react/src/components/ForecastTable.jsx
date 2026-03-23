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
 * 25-column layout (7 spacers, 18 data columns):
 *
 *  0  Score ✓
 *  1  Synth. (Total composite)
 *  2  H (hour)
 *  3  spacer
 *  4  AROME total
 *  5  spacer
 *  6  ICON-EU B
 *  7  ICON-EU M
 *  8  ICON-EU H
 *  9  spacer
 * 10  ECMWF B
 * 11  ECMWF M
 * 12  ECMWF H
 * 13  spacer
 * 14  GFS B
 * 15  GFS M
 * 16  GFS H
 * 17  spacer
 * 18  Humid.
 * 19  Vent
 * 20  spacer
 * 21  Seeing
 * 22  Transp.
 * 23  spacer
 * 24  Moon
 */

const SUB_HEADERS = [
  { label: '\u2713' },           // 0  Score
  { label: 'Synth.' },          // 1  Total composite
  { label: 'H' },               // 2  Hour
  { label: '\uD83C\uDF19' },    // 3  Moon
  { spacer: true },              // 4
  { label: 'Total' },           // 5  AROME
  { spacer: true },              // 5
  { label: 'B' },               // 6  ICON-EU
  { label: 'M' },               // 7
  { label: 'H' },               // 8
  { spacer: true },              // 9
  { label: 'B' },               // 10 ECMWF
  { label: 'M' },               // 11
  { label: 'H' },               // 12
  { spacer: true },              // 13
  { label: 'B' },               // 14 GFS
  { label: 'M' },               // 15
  { label: 'H' },               // 16
  { spacer: true },              // 17
  { label: 'Humid.' },          // 18
  { label: 'Vent' },            // 19
  { spacer: true },              // 20
  { label: 'Seeing' },          // 21
  { label: 'Transp.' },         // 22
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
          {dayGroups.map(({ day, rows, isTruncated }) => (
            <DaySection key={day} day={day} rows={rows} now={now} isTruncated={isTruncated} ref={setDayRef(day)} />
          ))}
        </tbody>
      </Table>
    </div>
  );
}
