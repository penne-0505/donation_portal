'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

interface HeroContextType {
  heroInView: boolean;
  setHeroInView: (inView: boolean) => void;
  heroRef: (node: HTMLElement | null) => void;
  hasHeroSection: boolean;
}

const HeroContext = createContext<HeroContextType | undefined>(undefined);

export function HeroProvider({ children }: { readonly children: ReactNode }) {
  const [heroElement, setHeroElement] = useState<HTMLElement | null>(null);
  const [heroInView, setHeroInView] = useState(false);
  const [hasHeroSection, setHasHeroSection] = useState(false);

  const heroRef = useCallback((node: HTMLElement | null) => {
    setHeroElement(node);
  }, []);

  useEffect(() => {
    if (!heroElement) {
      setHasHeroSection(false);
      setHeroInView(false);
      return;
    }

    setHasHeroSection(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeroInView(entry.isIntersecting);
      },
      { threshold: 0.5 },
    );

    observer.observe(heroElement);

    return () => {
      observer.disconnect();
    };
  }, [heroElement]);

  const value: HeroContextType = {
    heroInView,
    setHeroInView,
    heroRef,
    hasHeroSection,
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
