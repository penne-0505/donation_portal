'use client';

import { createContext, useContext, useRef, useState, ReactNode, useEffect } from 'react';

interface HeroContextType {
  heroInView: boolean;
  setHeroInView: (inView: boolean) => void;
  heroRef: React.RefObject<HTMLElement>;
}

const HeroContext = createContext<HeroContextType | undefined>(undefined);

export function HeroProvider({ children }: { readonly children: ReactNode }) {
  const heroRef = useRef<HTMLElement>(null);
  const [heroInView, setHeroInView] = useState(true);

  useEffect(() => {
    if (!heroRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeroInView(entry.isIntersecting);
      },
      { threshold: 0.5 },
    );

    observer.observe(heroRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const value: HeroContextType = {
    heroInView,
    setHeroInView,
    heroRef,
  };

  return <HeroContext.Provider value={value}>{children}</HeroContext.Provider>;
}

export function useHeroContext() {
  const context = useContext(HeroContext);
  if (!context) {
    throw new Error('useHeroContext must be used within a HeroProvider');
  }
  return context;
}
