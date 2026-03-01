import styled from 'styled-components';
import LocationSearch from './LocationSearch.jsx';
import MoonBadge from './MoonBadge.jsx';

const HeaderWrap = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #1a1a2e;
  background: #0a0a14;
`;

const Title = styled.h1`
  font-size: 1.1rem;
  color: #e8eaf6;
`;

const Subtitle = styled.span`
  font-size: 0.72rem;
  font-style: italic;
  color: #fff;
  font-weight: 400;
`;

export default function Header({ locationName, onLocationChange }) {
  return (
    <HeaderWrap>
      <span>{'\uD83C\uDF11'}</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Title>AstroGuard</Title>
        <Subtitle>Made by VelocityPulse</Subtitle>
      </div>
      <LocationSearch locationName={locationName} onSelect={onLocationChange} />
      <MoonBadge />
    </HeaderWrap>
  );
}
