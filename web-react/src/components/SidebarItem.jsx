import styled from 'styled-components';
import { cloudColor } from '../utils/colors.js';

const Item = styled.div`
  padding: 9px 12px;
  border-bottom: 1px solid #0f0f1e;
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &:hover { background: #0f0f22; }

  &.active {
    background: #111130;
    border-left: 3px solid #3949ab;
    padding-left: 9px;
  }
`;

const Top = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  font-weight: 700;
`;

const Icon = styled.span`
  font-size: 0.85rem;
`;

const Label = styled.span`
  color: #c9d1e0;
  font-weight: 600;
`;

const Pct = styled.div`
  font-size: 0.68rem;
  color: #546e7a;
  font-weight: 500;
`;

const Clouds = styled.div`
  display: flex;
  gap: 4px;
  font-size: 0.68rem;
  color: #546e7a;
  margin-top: 2px;
`;

const CloudTag = styled.span`
  background: #111128;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 600;
`;

export default function SidebarItem({ day, stats, active, onClick }) {
  const avgClouds = stats.total ? stats.sumClouds / stats.total : 100;
  const pct = Math.round(100 - avgClouds);

  let icon;
  if (avgClouds <= 20) icon = '\u2705';
  else if (avgClouds <= 50) icon = '\u25B2';
  else icon = '\uD83D\uDD34';

  const iconColor = avgClouds <= 20 ? undefined : avgClouds <= 50 ? '#ffd54f' : undefined;

  const t = new Date(day + 'T12:00:00');
  const next = new Date(t);
  next.setDate(next.getDate() + 1);
  const label =
    t.toLocaleDateString('fr-FR', { weekday: 'short' }) + '-' +
    next.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

  const avgL = stats.total ? Math.round(stats.sumL / stats.total) : '\u2014';
  const avgM = stats.total ? Math.round(stats.sumM / stats.total) : '\u2014';
  const avgH = stats.total ? Math.round(stats.sumH / stats.total) : '\u2014';

  return (
    <Item className={active ? 'active' : ''} data-day={day} onClick={onClick}>
      <Top>
        <Icon style={iconColor ? { color: iconColor } : undefined}>{icon}</Icon>
        <Label>{label}</Label>
      </Top>
      <Pct>{pct}% de la nuit d{'\u00E9'}gag{'\u00E9'}e</Pct>
      <Clouds>
        <CloudTag style={{ color: cloudColor(avgL) }}>B:{avgL}%</CloudTag>
        <CloudTag style={{ color: cloudColor(avgM) }}>M:{avgM}%</CloudTag>
        <CloudTag style={{ color: cloudColor(avgH) }}>H:{avgH}%</CloudTag>
      </Clouds>
    </Item>
  );
}
