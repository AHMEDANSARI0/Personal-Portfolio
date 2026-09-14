import WebGL from "three/examples/jsm/capabilities/WebGL.js";

/**
 * Should this device get the full 3D hero?
 * - no WebGL → poster
 * - small screen → poster (unless admin enables 3D on mobile)
 * - coarse pointer + low memory → poster
 * The check runs once, client-side; it never blocks paint.
 */
export function canRender3D(allowMobile: boolean): boolean {
  if (typeof window === "undefined") return false;
  try {
    const w: Record<string, unknown> = WebGL as unknown as Record<string, unknown>;
    const ok =
      typeof w.isWebGLAvailable === "function"
        ? (w.isWebGLAvailable as () => boolean)()
        : typeof w.getWebGL2 === "function"
          ? Boolean((w.getWebGL2 as () => unknown)())
          : Boolean(document.createElement("canvas").getContext("webgl2"));
    if (!ok) return false;
  } catch {
    return false;
  }
  const smallScreen = window.matchMedia("(max-width: 820px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const lowMemory = "deviceMemory" in navigator && (navigator as { deviceMemory?: number }).deviceMemory !== undefined
    ? (navigator as unknown as { deviceMemory: number }).deviceMemory <= 4
    : false;
  if (smallScreen && coarse && !allowMobile) return false;
  if (lowMemory && !allowMobile && smallScreen) return false;
  return true;
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
