"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Hero loading state shared between the canvas (drei useProgress) and the
 * preloader overlay. Kept tiny on purpose — the overlay re-renders during
 * load but the 3D scene never subscribes to it.
 */
interface HeroStatus {
  progress: number;
  ready: boolean;
  report: (pct: number) => void;
  setReady: (v: boolean) => void;
}

const Ctx = createContext<HeroStatus>({
  progress: 0,
  ready: true,
  report: () => {},
  setReady: () => {},
});

export function useHeroStatus() {
  return useContext(Ctx);
}

export function HeroStatusProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  const report = useCallback((pct: number) => {
    setProgress((prev) => Math.max(prev, Math.min(100, Math.round(pct))));
  }, []);

  const value = useMemo(
    () => ({ progress, ready, report, setReady }),
    [progress, ready, report],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
