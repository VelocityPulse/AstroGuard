import { useRef, useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import DaySection from './DaySection.jsx';
import { useScrollSpy } from '../hooks/useScrollSpy.js';

const Table = styled.table`
  border-collapse: separate;
  border-spacing: 0;
  width: fit-content;
`;

const HEADERS = [
  { label: '\u2713', first: true },
  { label: 'H' },
  { spacer: true },
  { label: 'Total' },
  { spacer: true },
  { label: 'Bas' },
  { label: 'Moy' },
  { label: 'Haut' },
  { spacer: true },
  { label: 'Humid.' },
  { label: 'Vent' },
  { spacer: true },
  { label: 'Seeing' },
  { label: 'Transp.' },
  { label: '\uD83C\uDF19' },
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
    <div className="main">
      <Table>
        <thead>
          <tr>
            {HEADERS.map((h, i) => (
              <th key={i} className={h.spacer ? 'cloud-gap' : ''}>
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
