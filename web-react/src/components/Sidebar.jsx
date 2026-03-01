import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import SidebarItem from './SidebarItem.jsx';

const SidebarWrap = styled.div`
  position: sticky;
  top: 58px;
  width: 230px;
  max-height: calc(100vh - 70px);
  flex-shrink: 0;
  background: #0c0c1c;
  border: 1px solid #1e1e3a;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 99;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #1e1e38; border-radius: 2px; }
`;

const Title = styled.div`
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #37474f;
  padding: 12px 12px 7px;
  border-bottom: 1px solid #111128;
`;

export default function Sidebar({ nightStats, activeDay, onDayClick }) {
  const activeRef = useRef(null);
  const nights = Object.keys(nightStats).sort();

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [activeDay]);

  return (
    <SidebarWrap>
      <Title>Sommaire</Title>
      {nights.map((day) => (
        <div key={day} ref={day === activeDay ? activeRef : undefined}>
          <SidebarItem
            day={day}
            stats={nightStats[day]}
            active={day === activeDay}
            onClick={() => onDayClick(day)}
          />
        </div>
      ))}
    </SidebarWrap>
  );
}
