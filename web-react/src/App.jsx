import { useState, useCallback, useEffect, useRef } from 'react';
import GlobalStyle from './GlobalStyle.js';
import Header from './components/Header.jsx';
import ModelDescriptions from './components/ModelDescriptions.jsx';
import Sidebar from './components/Sidebar.jsx';
import ForecastTable from './components/ForecastTable.jsx';
import Loader from './components/Loader.jsx';
import { useLocation } from './hooks/useLocation.js';
import { useWeatherData } from './hooks/useWeatherData.js';

export default function App() {
  const { location, setLocation } = useLocation();
  const { data, loading, error } = useWeatherData(location.lat, location.lon);
  const [activeDay, setActiveDay] = useState(null);
  const headerRef = useRef(null);

  // Calibrate --header-h CSS variable
  useEffect(() => {
    if (headerRef.current) {
      const h = headerRef.current.offsetHeight;
      document.documentElement.style.setProperty('--header-h', h + 'px');
    }
  }, [data]);

  const handleLocationChange = useCallback((loc) => {
    setLocation(loc);
  }, [setLocation]);

  const handleDayClick = useCallback((day) => {
    // Night key = evening date; core observation hours (minuit→aube) are on the next day
    const d = new Date(day + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    const nextDay = d.toISOString().slice(0, 10);
    const el = document.getElementById('day-' + nextDay) || document.getElementById('day-' + day);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2 + 160;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }, []);

  const handleActiveDayChange = useCallback((day) => {
    setActiveDay(day);
  }, []);

  return (
    <>
      <GlobalStyle />
      <div ref={headerRef}>
        <Header locationName={location.name} onLocationChange={handleLocationChange} />
      </div>
      {loading || error ? (
        <Loader error={error} />
      ) : (
        <>
        <ModelDescriptions />
        <div className="content-area">
          <Sidebar
            nightStats={data.nightStats}
            activeDay={activeDay}
            onDayClick={handleDayClick}
          />
          <ForecastTable
            dayGroups={data.dayGroups}
            onActiveDayChange={handleActiveDayChange}
          />
        </div>
        </>
      )}
    </>
  );
}
