import { useState, useCallback } from 'react';

const STORAGE_KEY = 'astroguard-loc';
const DEFAULT_LOCATION = { lat: 48.8773, lon: 2.1890, name: 'Rueil-Malmaison' };

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_LOCATION;
}

export function useLocation() {
  const [location, setLocationState] = useState(loadSaved);

  const setLocation = useCallback((loc) => {
    setLocationState(loc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  }, []);

  return { location, setLocation };
}
