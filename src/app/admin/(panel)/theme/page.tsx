"use client";

import { useEffect, useState } from "react";
import { api, Card, Field, Input, SaveBar, Toggle, UploadButton, useToast } from "@/components/admin/ui";
import { GlbPreview } from "@/components/admin/glb-preview";
import { FONT_PAIRS } from "@/lib/fonts";
import { THEME_PRESETS } from "@/lib/theme";
import type { AvatarContent, SiteContentMap, ThemeContent } from "@/lib/types";

export default function ThemeAdmin() {
  const [theme, setTheme] = useState<ThemeContent | null>(null);
  const [avatar, setAvatar] = useState<AvatarContent | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api<SiteContentMap>("/api/admin/content")
      .then((c) => {
        setTheme(c.theme);
        setAvatar(c.avatar);
      })
      .catch((e) => toast.show(e.message, "err"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!theme || !avatar) return <p className="py-20 text-center text-sm text-muted">Loading…</p>;

  async function saveAll() {
    setSaving(true);
    try {
      await api("/api/admin/content", { method: "PUT", body: JSON.stringify({ key: "theme", value: theme }) });
      await api("/api/admin/content", { method: "PUT", body: JSON.stringify({ key: "avatar", value: avatar }) });
      toast.show("Theme + avatar saved");
    } catch (e) {
      toast.show((e as Error).message, "err");
    } finally {
      setSaving(false);
    }
  }

  function updateStudio(patch: Partial<ThemeContent["heroStudio"]>) {
    setTheme((current) =>
      current ? { ...current, heroStudio: { ...current.heroStudio, ...patch } } : current,
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Theme & 3D avatar</h1>
        <p className="mt-1 text-sm text-muted">Pick whatever you like — every value below is editable live, nothing is locked in.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Palette" desc="Neutral base + one accent. Presets are one-click; fine-tune after.">
          <div className="space-y-5">
            <Field label="Hero template" hint="Classic keeps the current hero. AI Studio enables the interactive workspace scene.">
              <div className="flex flex-wrap gap-2">
                {(["classic", "ai-studio"] as const).map((template) => (
                  <button
                    key={template}
                    onClick={() => setTheme({ ...theme, template })}
                    className="rounded-lg border px-3 py-2 text-sm capitalize"
                    style={{ borderColor: theme.template === template ? "var(--accent)" : "var(--line)", fontWeight: theme.template === template ? 600 : 400 }}
                  >
                    {template === "ai-studio" ? "AI Studio" : "Classic hero"}
                  </button>
                ))}
              </div>
            </Field>

            {theme.template === "ai-studio" && (
              <div className="space-y-5 rounded-xl border border-line bg-bg-soft p-4">
                <p className="text-sm font-semibold">AI Studio controls</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Background start"><Input type="color" value={theme.heroStudio.backgroundStart} onChange={(e) => updateStudio({ backgroundStart: e.target.value })} /></Field>
                  <Field label="Background end"><Input type="color" value={theme.heroStudio.backgroundEnd} onChange={(e) => updateStudio({ backgroundEnd: e.target.value })} /></Field>
                  <Field label="Glow color"><Input type="color" value={theme.heroStudio.glowColor} onChange={(e) => updateStudio({ glowColor: e.target.value })} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={`Glow intensity ${theme.heroStudio.glowIntensity}`}><Input type="range" min="0" max="1" step="0.05" value={theme.heroStudio.glowIntensity} onChange={(e) => updateStudio({ glowIntensity: Number(e.target.value) })} /></Field>
                  <Field label={`Floating density ${theme.heroStudio.floatingDensity}`}><Input type="range" min="3" max="12" step="1" value={theme.heroStudio.floatingDensity} onChange={(e) => updateStudio({ floatingDensity: Number(e.target.value) })} /></Field>
                  <Field label={`Floating speed ${theme.heroStudio.floatingSpeed}`}><Input type="range" min="0.25" max="3" step="0.25" value={theme.heroStudio.floatingSpeed} onChange={(e) => updateStudio({ floatingSpeed: Number(e.target.value) })} /></Field>
                  <Field label={`Robot scale ${theme.heroStudio.robotScale}`}><Input type="range" min="0.7" max="1.35" step="0.05" value={theme.heroStudio.robotScale} onChange={(e) => updateStudio({ robotScale: Number(e.target.value) })} /></Field>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Toggle checked={theme.heroStudio.floatingEnabled} onChange={(v) => updateStudio({ floatingEnabled: v })} label="Floating elements" />
                  <Toggle checked={theme.heroStudio.robotMotion} onChange={(v) => updateStudio({ robotMotion: v })} label="Robot motion" />
                </div>
                <Field label="Screen sequence" hint="Mixed rotates through code, automation, and live preview.">
                  <select className="field" value={theme.heroStudio.screenMode} onChange={(e) => updateStudio({ screenMode: e.target.value as ThemeContent["heroStudio"]["screenMode"] })}>
                    <option value="mixed">Mixed sequence</option>
                    <option value="code">Code editor</option>
                    <option value="preview">Live preview</option>
                  </select>
                </Field>
              </div>
            )}

            <div className="flex gap-2">
              {(["light", "dark"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setTheme({ ...theme, mode: m })}
                  className="rounded-lg border px-4 py-2 text-sm capitalize"
                  style={{
                    borderColor: theme.mode === m ? "var(--accent)" : "var(--line)",
                    fontWeight: theme.mode === m ? 600 : 400,
                  }}
                >
                  {m} base
                </button>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {THEME_PRESETS.map((p) => {
                const active = theme.accent.toLowerCase() === p.accent.toLowerCase() && theme.mode === p.mode;
                return (
                  <button
                    key={p.key}
                    onClick={() => setTheme({ ...theme, mode: p.mode as ThemeContent["mode"], accent: p.accent })}
                    className="flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors"
                    style={{ borderColor: active ? "var(--accent)" : "var(--line)" }}
                  >
                    <span className="h-7 w-7 shrink-0 rounded-full border border-line" style={{ background: p.accent }} />
                    <span className="min-w-0">
                      <span className="block truncate">{p.label}</span>
                      <span className="text-xs uppercase text-muted">{p.mode}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-end gap-3">
              <Field label="Accent (custom)">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.accent}
                    onChange={(e) => setTheme({ ...theme, accent: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-transparent"
                    aria-label="Accent color picker"
                  />
                  <Input value={theme.accent} onChange={(e) => setTheme({ ...theme, accent: e.target.value })} className="w-32 font-mono" />
                </div>
              </Field>
              <span className="mb-2 text-xs text-muted">drives links, buttons, marquee dots + the 3D rim light</span>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-line p-3">
              <span className="h-8 w-8 rounded-full" style={{ background: theme.accent }} />
              <button className="btn btn-primary !py-1.5 text-xs">Primary button preview</button>
              <a className="text-sm underline" style={{ color: theme.accent }}>
                inline link
              </a>
            </div>

            <Field label="Type (max 2 families)" hint="System stack = zero webfont download. Others load from Google Fonts (self-host via next/font later if you want).">
              <div className="flex flex-wrap gap-2">
                {FONT_PAIRS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setTheme({ ...theme, fonts: f.key })}
                    className="rounded-lg border px-3 py-2 text-sm"
                    style={{
                      borderColor: theme.fonts === f.key ? "var(--accent)" : "var(--line)",
                      fontFamily: f.display,
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <Field label="Default OG image (1200×630)">
                  <div className="flex items-center gap-3">
                    {theme.ogImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={theme.ogImage} alt="" className="h-14 w-24 rounded-md border border-line object-cover" />
                    )}
                    <UploadButton label="Upload" onUploaded={(url) => setTheme({ ...theme, ogImage: url })} />
                  </div>
                </Field>
                <Field label="Favicon">
                  <div className="flex items-center gap-3">
                    <UploadButton label="Upload .ico/.png/svg" accept="image/*" onUploaded={(url) => setTheme({ ...theme, faviconUrl: url })} />
                    {theme.faviconUrl && (
                      <button className="text-xs text-muted underline" onClick={() => setTheme({ ...theme, faviconUrl: "" })}>
                        clear
                      </button>
                    )}
                  </div>
                </Field>
              </div>
              <Toggle
                checked={theme.hero3dOnMobile}
                onChange={(v) => setTheme({ ...theme, hero3dOnMobile: v })}
                label="Force 3D on mobile too"
              />
              <p className="text-xs leading-relaxed text-muted">
                Off = phones/small screens get the static poster render (recommended; keeps Lighthouse 90+ on mid-range
                devices). On = everyone gets WebGL with adaptive DPR.
              </p>
            </div>
          </div>
        </Card>

        <Card title="3D avatar" desc="Drop-in GLB swap: upload, preview, apply. Nothing is hardcoded to the old model.">
          <div className="space-y-5">
            <GlbPreview url={avatar.modelUrl} />
            <div className="flex flex-wrap items-center gap-3">
              <UploadButton
                label="Upload .glb / .gltf"
                kind="model"
                localOnly
                accept=".glb,.gltf,model/gltf-binary"
                onUploaded={async (_url, name, file) => {
                  // route GLBs through /api/admin/avatar so modelUrl updates atomically
                  toast.show(`Applying ${name}…`);
                  const fd = new FormData();
                  fd.append("file", file);
                  const updated = await api<AvatarContent>("/api/admin/avatar", { method: "PUT", body: fd });
                  setAvatar({ ...updated, height: Number(updated.height), yOffset: Number(updated.yOffset) });
                  toast.show("Model uploaded + applied — preview above");
                }}
              />
              <Input
                value={avatar.modelUrl}
                onChange={(e) => setAvatar({ ...avatar, modelUrl: e.target.value })}
                className="max-w-64 font-mono text-xs"
                aria-label="Model URL"
              />
            </div>
            <p className="text-xs text-muted">
              Budget: keep the GLB under ~3–5 MB. Run <code>pnpm avatar:optimize</code> for Draco + WebP textures
              (1–2 K max). If Draco-compressed, drop the decoder at <code>public/draco/</code>.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Normalised height" hint="auto-scales any model to this">
                <Input
                  type="number"
                  step={0.1}
                  value={avatar.height}
                  onChange={(e) => setAvatar({ ...avatar, height: Number(e.target.value) })}
                />
              </Field>
              <Field label="Vertical offset" hint="nudge into frame">
                <Input
                  type="number"
                  step={0.05}
                  value={avatar.yOffset}
                  onChange={(e) => setAvatar({ ...avatar, yOffset: Number(e.target.value) })}
                />
              </Field>
            </div>
            <Field label="Head bone name hints" hint="comma separated — used for cursor tracking if your rig has them">
              <Input
                value={avatar.headBoneHints.join(", ")}
                onChange={(e) =>
                  setAvatar({ ...avatar, headBoneHints: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
                }
              />
            </Field>
            <Field label="Mobile / reduced-motion poster" hint="static high-quality render shown instead of WebGL">
              <div className="flex items-center gap-3">
                {avatar.posterUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar.posterUrl} alt="" className="h-14 w-20 rounded-md border border-line object-cover" />
                )}
                <UploadButton label="Upload poster" onUploaded={(url) => setAvatar({ ...avatar, posterUrl: url })} />
              </div>
            </Field>
          </div>
        </Card>
      </div>

      <Card>
        <SaveBar onSave={saveAll} saving={saving} />
      </Card>
      {toast.node}
    </div>
  );
}
