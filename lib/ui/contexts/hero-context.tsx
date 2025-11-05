'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';

interface HeroContextType {
  heroInView: boolean;
  setHeroInView: (inView: boolean) => void;
  heroRef: (node: HTMLElement | null) => void;
  hasHeroSection: boolean;
  shouldDeemphasizeButton: boolean;
  setShouldDeemphasizeButton: (value: boolean) => void;
  buttonShouldBeDeemphasized: boolean;
}

const HeroContext = createContext<HeroContextType | undefined>(undefined);

export function HeroProvider({ children }: { readonly children: ReactNode }) {
  const [heroElement, setHeroElement] = useState<HTMLElement | null>(null);
  const [heroInView, setHeroInView] = useState(false);
  const [hasHeroSection, setHasHeroSection] = useState(false);
  const [shouldDeemphasizeButton, setShouldDeemphasizeButton] = useState(false);

  const heroRef = useCallback((node: HTMLElement | null) => {
    setHeroElement(node);
  }, []);

  // Compute whether button should be deemphasized: either hero is in view OR explicitly set
  const buttonShouldBeDeemphasized = useMemo(() => {
    return heroInView || shouldDeemphasizeButton;
  }, [heroInView, shouldDeemphasizeButton]);

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
    shouldDeemphasizeButton,
    setShouldDeemphasizeButton,
    buttonShouldBeDeemphasized,
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
