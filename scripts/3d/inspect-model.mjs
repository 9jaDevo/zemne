import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const bytes = readFileSync("public/3d/sanctuary-mobile.glb");
if (bytes.readUInt32LE(0) !== 0x46546c67) throw new Error("Invalid GLB header");
const gltf = JSON.parse(
  bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString(),
);
const manifest = {
  model: "sanctuary-mobile.glb",
  source: "scripts/3d/build-sanctuary.py",
  architecture: "Original ZEMNE Garden of Light sanctuary",
  blender: "4.5.15 LTS",
  optimizer: "glTF Transform 4.5.1 / Meshopt / WebP",
  bytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  mesh_objects: gltf.meshes.length,
  primitives: gltf.meshes.reduce(
    (sum, mesh) => sum + mesh.primitives.length,
    0,
  ),
  triangles: gltf.meshes.reduce(
    (sum, mesh) =>
      sum +
      mesh.primitives.reduce(
        (count, primitive) =>
          count + gltf.accessors[primitive.indices].count / 3,
        0,
      ),
    0,
  ),
  embedded_images: gltf.images.length,
  destinations: [
    ...new Set(
      gltf.nodes.map((node) => node.extras?.destination).filter(Boolean),
    ),
  ].sort(),
  portrait: "Original neutral abstract relief, not a real person",
  baked_lighting: false,
  physical_mobile_gpu_tested: false,
};
writeFileSync(
  "public/3d/sanctuary-manifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(JSON.stringify(manifest, null, 2));
