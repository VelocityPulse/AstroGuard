import { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';

const Wrap = styled.div`
  position: relative;
  margin-left: 6px;
`;

const Input = styled.input`
  background: #14142a;
  border: 1px solid #1e1e3a;
  border-radius: 6px;
  color: #5c6bc0;
  font-size: 0.82rem;
  padding: 4px 10px;
  width: 220px;
  outline: none;
  font-family: inherit;
  &:focus { border-color: #3949ab; }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 300px;
  max-height: 260px;
  overflow-y: auto;
  background: #111128;
  border: 1px solid #1e1e3a;
  border-radius: 8px;
  margin-top: 4px;
  z-index: 200;
  box-shadow: 0 8px 24px rgba(0,0,0,0.6);
`;

const LocItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.8rem;
  color: #c9d1e0;
  border-bottom: 1px solid #0f0f1e;
  &:hover { background: #1a1a3a; }
`;

const LocSub = styled.div`
  font-size: 0.68rem;
  color: #546e7a;
  margin-top: 2px;
`;

export default function LocationSearch({ locationName, onSelect }) {
  const [query, setQuery] = useState(locationName);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);

  // Sync external name changes
  useEffect(() => {
    setQuery(locationName);
  }, [locationName]);

  const handleInput = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    if (val.trim().length < 2) {
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(val.trim())}&count=6&language=fr`)
        .then((r) => r.json())
        .then((data) => {
          if (data.results && data.results.length) {
            setResults(data.results);
            setOpen(true);
          } else {
            setOpen(false);
          }
        })
        .catch(() => setOpen(false));
    }, 300);
  }, []);

  const handleSelect = useCallback((r) => {
    setQuery(r.name);
    setOpen(false);
    onSelect({ lat: r.latitude, lon: r.longitude, name: r.name });
  }, [onSelect]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <Wrap ref={wrapRef}>
      <span style={{ color: '#5c6bc0' }}>{'\uD83D\uDCCD'}</span>
      <Input
        type="text"
        placeholder="Rechercher une ville..."
        value={query}
        onChange={handleInput}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <Dropdown>
          {results.map((r) => {
            const sub = [r.admin1, r.country].filter(Boolean).join(', ');
            return (
              <LocItem key={`${r.latitude}-${r.longitude}-${r.name}`} onClick={() => handleSelect(r)}>
                {r.name}
                <LocSub>{sub} {'\u00B7'} {r.latitude.toFixed(2)}{'\u00B0'}N {r.longitude.toFixed(2)}{'\u00B0'}E</LocSub>
              </LocItem>
            );
          })}
        </Dropdown>
      )}
    </Wrap>
  );
}
