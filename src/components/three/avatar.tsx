"use client";

import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import type { AvatarContent } from "@/lib/types";

type LoadedGltf = { scene: THREE.Group; animations: THREE.AnimationClip[] };

/**
 * Drop-in avatar renderer.
 *  - loads whatever URL the admin panel saved (default: /models/avatar.glb)
 *  - Draco-compressed GLBs supported out of the box (decoder from /draco or CDN)
 *  - normalises scale/position from the bounding box → swapping models needs no code change
 *  - plays the model's own animation clips if present; otherwise idle float + breathing
 *  - head bones (name-matched via hints) and the whole model follow the cursor, damped
 *  - if the file is missing, renders a procedural low-poly stand-in so the pipeline is proven
 */
export function Avatar({ config, onReady }: { config: AvatarContent; onReady?: () => void }) {
  const [gltf, setGltf] = useState<LoadedGltf | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(config.modelUrl, { cache: "force-cache" });
        if (!res.ok) throw new Error(String(res.status));
        const buffer = await res.arrayBuffer();
        const loader = new GLTFLoader();
        const draco = new DRACOLoader();
        // put the decoder at public/draco after `pnpm avatar:optimize`, else CDN fallback
        draco.setDecoderPath("/draco/");
        draco.setDecoderConfig({ type: "js" });
        loader.setDRACOLoader(draco);
        const parsed = (await new Promise<LoadedGltf>((resolve, reject) =>
          loader.parse(buffer, "", (g) => resolve(g as LoadedGltf), reject),
        ));
        if (!cancelled) {
          setGltf({ scene: parsed.scene, animations: parsed.animations || [] });
          onReady?.();
        }
        draco.dispose();
      } catch {
        if (!cancelled) {
          setFailed(true);
          onReady?.(); // fallback bust needs no download — release the preloader
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config.modelUrl, onReady]);

  if (failed || !gltf) return <FallbackBust accent={undefined} />;

  return (
    <LoadedAvatar
      scene={gltf.scene}
      animations={gltf.animations}
      height={config.height}
      yOffset={config.yOffset}
      headHints={config.headBoneHints}
    />
  );
}

function LoadedAvatar({
  scene,
  animations,
  height,
  yOffset,
  headHints,
}: {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  height: number;
  yOffset: number;
  headHints: string[];
}) {
  const root = useRef<THREE.Group>(null);
  const mixer = useMemo(() => {
    const m = new THREE.AnimationMixer(scene);
    animations.forEach((clip) => m.clipAction(clip).play());
    return animations.length ? m : null;
  }, [scene, animations]);

  const { scale, center } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const c = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(c);
    const s = size.y > 0 ? height / size.y : 1;
    return { scale: s, center: c };
  }, [scene, height]);

  const head = useMemo(() => {
    let found: THREE.Object3D | null = null;
    scene.traverse((o) => {
      if (found) return;
      if (headHints.some((h) => o.name.toLowerCase().includes(h.toLowerCase()))) found = o;
    });
    return found as THREE.Object3D | null;
  }, [scene, headHints]);

  const damp = useRef({ yaw: 0, pitch: 0 });

  useFrame((state, delta) => {
    mixer?.update(delta);
    const p = state.pointer;
    const targetYaw = THREE.MathUtils.clamp(p.x, -1, 1) * 0.2;
    const targetPitch = THREE.MathUtils.clamp(-p.y, -1, 1) * 0.08;
    const d = damp.current;
    d.yaw = THREE.MathUtils.damp(d.yaw, targetYaw, 3.2, delta);
    d.pitch = THREE.MathUtils.damp(d.pitch, targetPitch, 3.2, delta);
    const g = root.current;
    if (g) {
      g.rotation.y = d.yaw;
      g.rotation.x = d.pitch;
      if (!mixer) {
        const t = state.clock.elapsedTime;
        g.position.y = yOffset + Math.sin(t * 0.9) * 0.02; // idle float
        g.scale.setScalar(scale * (1 + Math.sin(t * 1.6) * 0.004)); // breathing
      }
    }
    if (head) head.rotation.y += (d.yaw * 0.6 - head.rotation.y) * 0.08;
  });

  return (
    <group ref={root} position={[0, yOffset, 0]} scale={scale}>
      <group position={[-center.x, -center.y, -center.z]}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

/**
 * Procedural stand-in rendered until public/models/avatar.glb (or an admin
 * upload) exists. Low-poly, flat-shaded, fresnel rim in the accent color.
 */
function FallbackBust({ accent }: { accent?: string }) {
  const root = useRef<THREE.Group>(null);
  const color = accent || "#5B8CFF";

  const skin = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#A6AAB4", roughness: 0.55, flatShading: true }),
    [],
  );
  const hair = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#26262C", roughness: 0.7, flatShading: true }),
    [],
  );
  const rim = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        uniforms: { uColor: { value: new THREE.Color(color) } },
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal);
            vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV; uniform vec3 uColor;
          void main() {
            float fres = pow(1.0 - abs(dot(vN, vV)), 2.4);
            gl_FragColor = vec4(uColor * fres, fres * 0.75);
          }`,
      }),
    [color],
  );

  useEffect(() => {
    return () => {
      skin.dispose();
      hair.dispose();
      rim.dispose();
    };
  }, [skin, hair, rim]);

  useFrame((state, delta) => {
    const g = root.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const target = THREE.MathUtils.clamp(state.pointer.x, -1, 1) * 0.18;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, target, 3, delta);
    g.position.y = Math.sin(t * 0.9) * 0.02;
    g.scale.setScalar(1 + Math.sin(t * 1.6) * 0.005);
  });

  return (
    <group ref={root}>
      <group position={[0, 0.62, 0]}>
        <mesh material={skin}>
          <sphereGeometry args={[0.34, 16, 12]} />
        </mesh>
        <mesh material={hair} position={[0, 0.14, -0.02]} scale={[1.03, 0.72, 1.03]}>
          <sphereGeometry args={[0.35, 16, 12]} />
        </mesh>
        <mesh material={rim} scale={1.09}>
          <sphereGeometry args={[0.34, 24, 18]} />
        </mesh>
      </group>
      <mesh material={skin} position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.11, 0.13, 0.2, 8]} />
      </mesh>
      <group position={[0, -0.22, 0]}>
        <mesh material={skin}>
          <capsuleGeometry args={[0.34, 0.42, 4, 10]} />
        </mesh>
        <mesh material={rim} scale={[1.07, 1.04, 1.07]}>
          <capsuleGeometry args={[0.34, 0.42, 4, 10]} />
        </mesh>
        <mesh material={hair} position={[0, 0.26, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.085, 0.6, 3, 8]} />
        </mesh>
      </group>
    </group>
  );
}

