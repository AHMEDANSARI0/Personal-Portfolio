"use client";

import { useEffect, useState } from "react";
import type { HeroContent, HeroStudioSettings } from "@/lib/types";

const floatingShapes = ["diamond", "ring", "cube", "dot", "diamond", "ring", "cube", "dot", "diamond", "ring", "cube", "dot"] as const;

export function AiStudioHero({ hero, settings }: { hero: HeroContent; settings: HeroStudioSettings }) {
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.48 });
  const [screen, setScreen] = useState(0);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      setPointer({ x: event.clientX / window.innerWidth, y: event.clientY / window.innerHeight });
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  useEffect(() => {
    if (settings.screenMode !== "mixed") return;
    const timer = window.setInterval(() => setScreen((value) => (value + 1) % 3), 4200 / settings.floatingSpeed);
    return () => window.clearInterval(timer);
  }, [settings.screenMode, settings.floatingSpeed]);

  const css = {
    "--studio-start": settings.backgroundStart,
    "--studio-end": settings.backgroundEnd,
    "--studio-glow": settings.glowColor,
    "--studio-glow-opacity": settings.glowIntensity,
    "--studio-speed": `${settings.floatingSpeed}s`,
    "--robot-scale": settings.robotScale,
    "--robot-look-x": `${(pointer.x - 0.5) * 16}deg`,
    "--robot-look-y": `${(pointer.y - 0.48) * -8}deg`,
  } as React.CSSProperties;

  return (
    <section className="studio-hero" style={css}>
      {settings.floatingEnabled && (
        <div className="studio-floaters" aria-hidden="true">
          {floatingShapes.slice(0, settings.floatingDensity).map((shape, index) => (
            <span key={`${shape}-${index}`} className={`studio-floater studio-floater-${shape}`} style={{ "--i": index } as React.CSSProperties} />
          ))}
        </div>
      )}
      <div className="studio-hero-inner">
        <div className="studio-copy">
          <p className="eyebrow studio-eyebrow">{hero.kicker}</p>
          <h1>{hero.name}</h1>
          <p className="studio-tagline">{hero.tagline}</p>
          <div className="studio-actions">
            <a href={hero.ctaHref} className="btn btn-primary">{hero.ctaLabel}</a>
            <a href={hero.secondaryHref} className="btn btn-ghost">{hero.secondaryLabel}</a>
          </div>
          {hero.status && <p className="studio-status"><span />{hero.status}</p>}
        </div>

        <div className="studio-stage" aria-label="Interactive AI development workspace">
          <div className="studio-screen-glow" />
          <div className={`studio-browser studio-browser-${screen}`}>
            <div className="studio-browser-bar"><i /><i /><i /><span>workspace / intelligent-systems</span></div>
            <div className="studio-browser-body">
              {(settings.screenMode === "preview" || (settings.screenMode === "mixed" && screen === 2)) ? <LivePreview /> : settings.screenMode === "code" || screen === 0 ? <CodeEditor /> : <AutomationFlow />}
            </div>
          </div>
          <StudioRobot motion={settings.robotMotion} />
        </div>
      </div>
    </section>
  );
}

function CodeEditor() {
  return <div className="studio-code"><div className="studio-code-tabs"><b>automation.ts</b><span>live</span></div><pre><code><em>const</em> workflow = <strong>await</strong> agent<br />  .connect(<mark>"workspace"</mark>)<br />  .understand(input)<br />  .build(<mark>"better systems"</mark>);<br /><br /><em>return</em> workflow.<strong>deploy</strong>();</code></pre><div className="studio-terminal"><span>●</span> build complete <b>142ms</b></div></div>;
}

function AutomationFlow() {
  return <div className="studio-flow"><p>AI AUTOMATION PIPELINE</p><div className="studio-flow-row"><span>Trigger</span><i>→</i><span>Reason</span><i>→</i><span>Execute</span></div><div className="studio-flow-chart"><b style={{ height: "42%" }} /><b style={{ height: "72%" }} /><b style={{ height: "55%" }} /><b style={{ height: "88%" }} /><b style={{ height: "64%" }} /><b style={{ height: "96%" }} /></div></div>;
}

function LivePreview() {
  return <div className="studio-preview"><div className="studio-preview-nav"><b>your product</b><span>Dashboard</span><span>Insights</span><span>Deploy</span></div><div className="studio-preview-content"><div><small>ACTIVE SYSTEMS</small><strong>24</strong></div><div><small>TIME SAVED</small><strong>18.6h</strong></div><div className="studio-preview-wide"><small>PERFORMANCE</small><div className="studio-line-chart"><i /><i /><i /><i /><i /><i /></div></div></div></div>;
}

function StudioRobot({ motion }: { motion: boolean }) {
  return <div className={`studio-robot ${motion ? "studio-robot-moving" : ""}`} aria-hidden="true"><div className="studio-robot-head"><span className="studio-robot-visor"><i /><i /></span></div><div className="studio-robot-neck" /><div className="studio-robot-body"><span className="studio-robot-core" /></div><div className="studio-robot-arm studio-robot-arm-left"><span /><b /></div><div className="studio-robot-arm studio-robot-arm-right"><span /><b /></div><div className="studio-robot-hand studio-robot-hand-left"><i /><i /><i /></div><div className="studio-robot-hand studio-robot-hand-right"><i /><i /><i /></div><div className="studio-robot-base" /></div>;
}
