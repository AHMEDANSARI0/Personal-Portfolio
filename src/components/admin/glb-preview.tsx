"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const OrbitCanvas = dynamic(
  () =>
    import("./glb-canvas").then((m) => m.GlbCanvas),
  { ssr: false, loading: () => <Pane>Loading viewer…</Pane> },
);

/**
 * Admin GLB preview: fetch + parse the file exactly like the live hero does,
 * then show it orbitable in a tiny canvas. Proves the pipeline before the
 * model ever touches the public page.
 */
export function GlbPreview({ url, className = "" }: { url: string; className?: string }) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const token = useRef(0);

  useEffect(() => {
    const my = ++token.current;
    setStatus("loading");
    setModel(null);
    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(String(res.status));
        const buf = await res.arrayBuffer();
        const loader = new GLTFLoader();
        const draco = new DRACOLoader();
        draco.setDecoderPath("/draco/");
        loader.setDRACOLoader(draco);
        const gltf = (await new Promise<{ scene: THREE.Group }>((resolve, reject) =>
          loader.parse(buf, "", (g) => resolve(g as { scene: THREE.Group }), reject),
        ));
        if (my !== token.current) return;
        // normalise to a unit box like the hero does
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        const s = 2 / Math.max(size.x, size.y, size.z || 1);
        gltf.scene.scale.setScalar(s);
        gltf.scene.position.set(-center.x * s, -center.y * s, -center.z * s);
        setModel(gltf.scene);
        setStatus("ok");
      } catch {
        if (my === token.current) setStatus("error");
      }
    })();
  }, [url]);

  const memoUrl = useMemo(() => url, [url]);

  return (
    <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-line bg-bg ${className}`}>
      {status === "loading" && <Pane>Parsing {shorten(memoUrl)}…</Pane>}
      {status === "error" && <Pane>Could not load this file</Pane>}
      {status === "ok" && model && <OrbitCanvas model={model} />}
    </div>
  );
}

function Pane({ children }: { children: React.ReactNode }) {
  return <div className="grid h-full place-items-center p-6 text-center text-xs text-muted">{children}</div>;
}

function shorten(u: string) {
  return u.length > 40 ? "…" + u.slice(-38) : u;
}
