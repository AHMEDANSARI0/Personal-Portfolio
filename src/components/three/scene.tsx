"use client";

import { PerformanceMonitor, ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "./avatar";
import { useHeroStatus } from "./hero-status";
import type { AvatarContent } from "@/lib/types";

/**
 * One R3F canvas, tuned for the brief's perf rules:
 *  - pixelRatio hard-capped at 2 (see `pixelRatio` below)
 *  - drei <PerformanceMonitor> halves DPR on sustained frame loss (flipflop-safe:
 *    it only steps down, never oscillates)
 *  - frameloop switches to "never" when the hero scrolls out of view
 *  - no React state is read per frame — all motion lives inside useFrame
 */
export default function HeroCanvas({ avatar, accent }: { avatar: AvatarContent; accent: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [perfScale, setPerfScale] = useState(1);

  const pixelRatio = useMemo(() => {
    if (typeof window === "undefined") return 1;
    return Math.min(window.devicePixelRatio || 1, 2); // brief: cap at 2
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      rootMargin: "120px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0" aria-hidden="true">
      <Canvas
        className="!absolute !inset-0"
        camera={{ position: [0, 0.35, 3.6], fov: 30 }}
        dpr={pixelRatio * perfScale}
        frameloop={visible ? "always" : "never"}
        gl={{
          antialias: perfScale >= 1,
          alpha: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({ gl }) => gl.setClearAlpha(0)}
      >
        <PerformanceMonitor flipflops={3} onDecline={() => setPerfScale(0.75)} onFallback={() => setPerfScale(0.5)}>
          <Suspense fallback={null}>
            <Rig accent={accent} />
            <AvatarStage avatar={avatar} />
            <ContactShadows
              position={[0, -1.05, 0]}
              opacity={0.42}
              scale={7}
              blur={2.6}
              far={2.2}
              resolution={512}
              frames={1} /* baked once — free on every later frame */
            />
          </Suspense>
        </PerformanceMonitor>
      </Canvas>
    </div>
  );
}

function AvatarStage({ avatar }: { avatar: AvatarContent }) {
  const { report, setReady } = useHeroStatus();
  const fired = useRef(false);

  const onReady = useCallback(() => {
    if (fired.current) return;
    fired.current = true;
    report(100);
    requestAnimationFrame(() => setReady(true)); // hold one more frame, then fade the preloader
  }, [report, setReady]);

  useEffect(() => {
    // safety: if nothing ever reports ready (e.g. slow network), release after 2.5s
    const t = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(t);
  }, [setReady]);

  return <Avatar config={avatar} onReady={onReady} />;
}

function Rig({ accent }: { accent: string }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3.2, 4.5, 3.5]} intensity={1.25} />
      {/* accent rim lights — the single splash of brand color, per the brief */}
      <directionalLight position={[-4, 1.6, -3.2]} intensity={1.5} color={accent} />
      <pointLight position={[2.4, -0.6, -2.6]} intensity={9} distance={12} color={accent} />
      <Environment resolution={64}>
        {/* procedural studio env: no HDR download, instant, stable reflections */}
        <Lightformer form="rect" intensity={1.4} position={[0, 3.2, 2.6]} scale={[7, 2.4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.5} position={[-4.5, 0.6, 1.5]} scale={[3, 3, 1]} target={[0, 0, 0]} />
      </Environment>
    </>
  );
}
