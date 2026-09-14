"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useHeroStatus } from "./three/hero-status";

/**
 * Real-progress overlay (not a fake timer): percentage fed by drei/GLB load
 * events. Rendered on the server at 0% so there is no blank flash before the
 * canvas hydrates; fades out with a transform-only animation.
 */
export function Preloader() {
  const { progress, ready } = useHeroStatus();
  const el = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);
  const [display, setDisplay] = useState(0);

  // smooth the raw percentage so it ticks up buttery even in bursts
  useEffect(() => {
    if (display >= progress) return;
    const t = setTimeout(() => setDisplay(progress), 40);
    return () => clearTimeout(t);
  }, [display, progress]);

  useEffect(() => {
    if (!ready || !el.current) return;
    const anim = gsap.to(el.current, {
      autoAlpha: 0,
      y: -8,
      duration: 0.5,
      ease: "power2.out",
      onComplete: () => setHidden(true),
    });
    return () => {
      anim.kill();
    };
  }, [ready]);

  if (hidden) return null;

  return (
    <div
      ref={el}
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-bg transition-none"
    >
      <p className="eyebrow mb-6">Loading experience</p>
      <div className="h-[2px] w-40 overflow-hidden rounded bg-line">
        <div
          className="h-full rounded transition-transform duration-200 ease-out"
          style={{
            background: "var(--accent)",
            transform: `scaleX(${display / 100})`,
            transformOrigin: "left",
            willChange: "transform",
          }}
        />
      </div>
      <p className="mt-4 font-mono text-xs tabular-nums text-muted">{display}%</p>
      <span className="sr-only">{display}% loaded</span>
    </div>
  );
}
