/**
 * Generates public/models/avatar.glb — a tiny stylized low-poly bust used as
 * the PLACEHOLDER until you drop in your real avatar (Ready Player Me export
 * or commissioned .glb). The R3F pipeline treats both identically:
 * bounding-box normalisation, optional animation clips, Draco support.
 *
 * Hand-rolled GLB 2.0 writer (no exporter deps): two primitives (skin + hair)
 * with POSITION/NORMAL/indices accessors. ~1-2 KB, flat-shaded look.
 *
 *   pnpm avatar:placeholder
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as THREE from "three";

const OUT = path.join(process.cwd(), "uploads", "model", "avatar.glb");

function part(geometry: THREE.BufferGeometry, transform: THREE.Matrix4) {
  geometry.applyMatrix4(transform);
  const pos = geometry.getAttribute("position").array as Float32Array;
  const nrm = (geometry.getAttribute("normal") as THREE.BufferAttribute).array as Float32Array;
  const idx = (geometry.getIndex()!.array as Uint16Array).slice();
  geometry.dispose();
  return { pos, nrm, idx };
}

type Part = { pos: Float32Array; nrm: Float32Array; idx: Uint16Array };

function merge(parts: Part[]) {
  let vCount = 0;
  let iCount = 0;
  for (const p of parts) {
    vCount += p.pos.length / 3;
    iCount += p.idx.length;
  }
  const pos = new Float32Array(vCount * 3);
  const nrm = new Float32Array(vCount * 3);
  const idx = new Uint16Array(iCount);
  let vo = 0;
  let io = 0;
  for (const p of parts) {
    pos.set(p.pos, vo * 3);
    nrm.set(p.nrm, vo * 3);
    for (let i = 0; i < p.idx.length; i++) idx[io + i] = p.idx[i] + vo;
    vo += p.pos.length / 3;
    io += p.idx.length;
  }
  return { pos, nrm, idx };
}

function main() {
  const M = THREE.Matrix4;
  const skin = merge([
    part(new THREE.SphereGeometry(0.34, 16, 12), new M().makeTranslation(0, 0.62, 0)),
    part(new THREE.CylinderGeometry(0.11, 0.13, 0.2, 8, 1), new M().makeTranslation(0, 0.24, 0)),
    part(new THREE.CapsuleGeometry(0.34, 0.42, 3, 10), new M().makeTranslation(0, -0.22, 0)),
  ]);
  const hair = merge([
    part(new THREE.SphereGeometry(0.352, 16, 12), new M().compose(new THREE.Vector3(0, 0.76, -0.02), new THREE.Quaternion(), new THREE.Vector3(1.02, 0.7, 1.02))),
    part(
      new THREE.CapsuleGeometry(0.085, 0.6, 2, 8),
      new M().compose(new THREE.Vector3(0, 0.04, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)), new THREE.Vector3(1, 1, 1)),
    ),
  ]);

  // ── GLB assembly ────────────────────────────────────────────────
  const meshes = [
    { name: "Skin", mat: 0, data: skin },
    { name: "Hair", mat: 1, data: hair },
  ];

  const bufferChunks: Buffer[] = [];
  const bufferViews: unknown[] = [];
  const accessors: unknown[] = [];
  let offset = 0;

  const addView = (buf: Buffer, target: number) => {
    bufferChunks.push(buf);
    const view = { buffer: 0, byteOffset: offset, byteLength: buf.length, target };
    bufferViews.push(view);
    offset += buf.length;
    const rem = offset % 4;
    if (rem) {
      const pad = Buffer.alloc(4 - rem);
      bufferChunks.push(pad);
      offset += pad.length;
    }
    return bufferViews.length - 1;
  };

  const primitives: unknown[] = [];
  for (const m of meshes) {
    const posView = addView(Buffer.from(m.data.pos.buffer, m.data.pos.byteOffset, m.data.pos.byteLength), 34962);
    const nrmView = addView(Buffer.from(m.data.nrm.buffer, m.data.nrm.byteOffset, m.data.nrm.byteLength), 34962);
    const idxView = addView(Buffer.from(m.data.idx.buffer, m.data.idx.byteOffset, m.data.idx.byteLength), 34963);

    const posArr = m.data.pos;
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < posArr.length; i += 3) {
      for (let c = 0; c < 3; c++) {
        min[c] = Math.min(min[c], posArr[i + c]);
        max[c] = Math.max(max[c], posArr[i + c]);
      }
    }

    accessors.push(
      { bufferView: posView, componentType: 5126, count: posArr.length / 3, type: "VEC3", min, max },
      { bufferView: nrmView, componentType: 5126, count: m.data.nrm.length / 3, type: "VEC3" },
      { bufferView: idxView, componentType: 5123, count: m.data.idx.length, type: "SCALAR" },
    );
    const base = accessors.length - 3;
    primitives.push({
      attributes: { POSITION: base, NORMAL: base + 1 },
      indices: base + 2,
      material: m.mat,
      mode: 4,
    });
  }

  const bin = Buffer.concat(bufferChunks);
  const gltf = {
    asset: { version: "2.0", generator: "make-placeholder-avatar (portfolio scaffold)" },
    scene: 0,
    scenes: [{ nodes: [0, 1] }],
    nodes: meshes.map((m, i) => ({ name: m.name, mesh: i })),
    meshes: meshes.map((m, i) => ({ name: m.name, primitives: [primitives[i]] })),
    materials: [
      {
        name: "SkinMat",
        pbrMetallicRoughness: { baseColorFactor: [0.65, 0.67, 0.71, 1], metallicFactor: 0.05, roughnessFactor: 0.55 },
      },
      {
        name: "HairMat",
        pbrMetallicRoughness: { baseColorFactor: [0.15, 0.15, 0.17, 1], metallicFactor: 0.1, roughnessFactor: 0.7 },
      },
    ],
    accessors,
    bufferViews,
    buffers: [{ byteLength: bin.length }],
  };

  let json = Buffer.from(JSON.stringify(gltf), "utf8");
  const jsonPad = (4 - (json.length % 4)) % 4;
  if (jsonPad) json = Buffer.concat([json, Buffer.alloc(jsonPad, 0x20)]);

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // glTF
  header.writeUInt32LE(2, 4); // version 2
  header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(json.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4); // JSON

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(bin.length, 0);
  binChunkHeader.writeUInt32LE(0x004e4942, 4); // BIN

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, Buffer.concat([header, jsonChunkHeader, json, binChunkHeader, bin]));
  const kb = (json.length + bin.length + 20) / 1024;
  console.log(`✓ wrote ${path.relative(process.cwd(), OUT)} (${kb.toFixed(1)} KB, ${meshes.length} primitives)`);
  console.log("  swap any .glb in at the same path (or upload via /admin/theme) — no code changes needed.");
}

main();
