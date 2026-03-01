import { useState, useEffect } from 'react';

export function useScrollSpy(dayRefs, deps) {
  const [activeDay, setActiveDay] = useState(null);

  useEffect(() => {
    const refs = dayRefs.current;
    if (!refs) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveDay(entry.target.dataset.day);
          }
        });
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
    );

    // Use requestAnimationFrame to ensure refs are populated after render
    const raf = requestAnimationFrame(() => {
      Object.values(refs).forEach((el) => {
        if (el) observer.observe(el);
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return activeDay;
}
