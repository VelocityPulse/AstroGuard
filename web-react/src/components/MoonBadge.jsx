import styled from 'styled-components';
import { moonPhase } from '../utils/astronomy.js';

const Badge = styled.div`
  margin-left: auto;
  font-size: 0.8rem;
  color: #7986cb;
`;

const THR_CLOUD = 20;

export default function MoonBadge() {
  const moon = moonPhase(new Date());
  return (
    <Badge>
      {moon.emoji} {moon.pct}% du cycle {'\u00B7'} seuil nuages {'\u2264'}{THR_CLOUD}%
    </Badge>
  );
}
