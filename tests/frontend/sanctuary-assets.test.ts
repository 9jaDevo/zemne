import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Object3D } from "three";
import { destinationFrom, sanctuaryViews } from "../../src/3d/hall-scene";

const model = readFileSync("public/3d/sanctuary-mobile.glb");
const document = JSON.parse(
  model.subarray(20, 20 + model.readUInt32LE(12)).toString(),
);

describe("shipped sanctuary", () => {
  it("ships real compressed geometry within the mobile download budget", () => {
    expect(model.readUInt32LE(0)).toBe(0x46546c67);
    expect(model.length).toBeLessThan(1_100_000);
    expect(document.meshes.length).toBeGreaterThan(10);
    expect(document.meshes.length).toBeLessThanOrEqual(30);
    expect(document.extensionsRequired).toContain("EXT_meshopt_compression");
  });
  it("preserves all three destinations through optimization", () => {
    const destinations = document.nodes
      .map(
        (node: { extras?: { destination?: string } }) =>
          node.extras?.destination,
      )
      .filter(Boolean);
    expect([...new Set(destinations)].sort()).toEqual([
      "guestbook",
      "tribute",
      "wall",
    ]);
  });
  it("embeds PBR maps and has no remote model or texture requests", () => {
    expect(document.images.length).toBeGreaterThanOrEqual(6);
    expect(
      document.images.every(
        (image: { uri?: string; bufferView?: number }) =>
          !image.uri && typeof image.bufferView === "number",
      ),
    ).toBe(true);
    expect(
      document.materials.some(
        (material: { normalTexture?: unknown }) => material.normalTexture,
      ),
    ).toBe(true);
    for (const name of [
      "entrance-v1",
      "guestbook-v1",
      "tribute-v1",
      "wall-v1",
    ]) {
      expect(statSync(`public/3d/sanctuary-${name}.webp`).size).toBeGreaterThan(
        10_000,
      );
    }
  });
  it("resolves a clicked child to its destination without accepting arbitrary tags", () => {
    const parent = new Object3D();
    const child = new Object3D();
    parent.add(child);
    parent.userData.destination = "tribute";
    expect(destinationFrom(child)).toBe("tribute");
    parent.userData.destination = "organizer";
    expect(destinationFrom(child)).toBeNull();
  });
  it("keeps every camera inside the modeled room", () => {
    for (const { position } of Object.values(sanctuaryViews)) {
      expect(Math.abs(position[0])).toBeLessThan(5);
      expect(position[1]).toBeGreaterThan(1);
      expect(position[1]).toBeLessThan(4.8);
      expect(Math.abs(position[2])).toBeLessThan(7);
    }
  });
});
