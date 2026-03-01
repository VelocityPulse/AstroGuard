import { useState, useCallback, useEffect, useRef } from 'react';
import GlobalStyle from './GlobalStyle.js';
import Header from './components/Header.jsx';
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
    const el = document.getElementById('day-' + day);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 90;
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
      )}
    </>
  );
}
