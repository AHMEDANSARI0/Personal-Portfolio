"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useEffect, useMemo, useState } from "react";
import { canRender3D, prefersReducedMotion } from "@/lib/client-capabilities";
import type { AvatarContent, HeroContent, ThemeContent } from "@/lib/types";
import { AiStudioHero } from "./ai-studio-hero";
import { HeroStatusProvider } from "./three/hero-status";
import { Preloader } from "./preloader";

/** The entire Three.js bundle is lazy — nav/text/admin never wait on it. */
const HeroCanvas = dynamic(() => import("./three/scene"), { ssr: false });

class CanvasErrorBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function Hero({
  hero,
  avatar,
  theme,
}: {
  hero: HeroContent;
  avatar: AvatarContent;
  theme: ThemeContent;
}) {
  if (theme.template === "ai-studio") {
    return <AiStudioHero hero={hero} settings={theme.heroStudio} />;
  }

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // decide once, after mount: full 3D, poster fallback, or nothing decorative
  const mode: "canvas" | "poster" = useMemo(() => {
    if (!mounted) return "poster";
    if (prefersReducedMotion()) return "poster";
    if (!canRender3D(theme.hero3dOnMobile)) return "poster";
    return "canvas";
  }, [mounted, theme.hero3dOnMobile]);

  return (
    <HeroStatusProvider>
      <section
        id="top"
        className="relative min-h-[100svh] w-full overflow-hidden bg-bg"
        style={{ minHeight: "100svh" }}
      >
        {/* 3D / poster stage — sits behind the copy */}
        <div className="absolute inset-0 z-0">
          <CanvasErrorBoundary fallback={<HeroPoster src={avatar.posterUrl} />}>
            {mode === "canvas" ? (
              <HeroCanvas avatar={avatar} accent={theme.accent} />
            ) : (
              <HeroPoster src={avatar.posterUrl} />
            )}
          </CanvasErrorBoundary>
        </div>

        {/* soft vignette keeps text readable regardless of model brightness */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 30%, transparent 40%, var(--bg) 100%)",
            opacity: 0.9,
          }}
        />

        <Preloader />

        {/* copy */}
        <div className="relative z-[2] mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-6 pb-20 pt-32 md:justify-center md:pb-0">
          <p className="eyebrow mb-5">{hero.kicker}</p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.03] tracking-tight md:text-7xl">
            {hero.name}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted md:text-xl">{hero.tagline}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href={hero.ctaHref} className="btn btn-primary">
              {hero.ctaLabel}
            </a>
            <a href={hero.secondaryHref} className="btn btn-ghost">
              {hero.secondaryLabel}
            </a>
            {hero.status && (
              <span className="ml-1 inline-flex items-center gap-2 text-sm text-muted">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
                {hero.status}
              </span>
            )}
          </div>
        </div>
      </section>
    </HeroStatusProvider>
  );
}

/**
 * Low-end / reduced-motion treatment: a static high-quality render instead of
 * a struggling WebGL context. Admin can replace this image from /admin/theme.
 */
function HeroPoster({ src }: { src: string }) {
  return (
    <div className="relative h-full w-full">
      <Image
        src={src}
        alt="3D avatar render"
        fill
        sizes="100vw"
        priority
        style={{ objectFit: "cover", objectPosition: "center 30%" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(180deg, transparent 30%, var(--bg) 96%)",
        }}
      />
    </div>
  );
}
