"use client";
/* eslint-disable react-hooks/immutability -- R3F owns mutable Three.js camera, texture and scene objects. */

import {
  Canvas,
  useFrame,
  useLoader,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

export type Destination = "overview" | "guestbook" | "tribute" | "wall";
export const sanctuaryViews: Record<
  Destination,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  overview: { position: [0.1, 1.85, 6.8], target: [0, 1.9, -4.8] },
  guestbook: { position: [-0.6, 1.9, 5.3], target: [-2.65, 1.15, 3.35] },
  tribute: { position: [1.5, 1.8, 4.0], target: [3.3, 1.2, 1.75] },
  wall: { position: [1.4, 1.9, -2.7], target: [4.75, 2.3, -4.5] },
};
function CameraRig({
  view,
  reducedMotion,
}: {
  view: Destination;
  reducedMotion: boolean;
}) {
  const { camera, size, invalidate } = useThree();
  const target = useRef(new THREE.Vector3(...sanctuaryViews.overview.target));
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = size.width < 600 ? 78 : 72;
      camera.updateProjectionMatrix();
    }
    invalidate();
  }, [camera, size, invalidate, view, reducedMotion]);
  useFrame((_, delta) => {
    const v = sanctuaryViews[view];
    const desired = new THREE.Vector3(...v.position);
    const look = new THREE.Vector3(...v.target);
    const amount = reducedMotion
      ? 1
      : 1 - Math.exp(-Math.min(delta, 0.05) * 3.2);
    camera.position.lerp(desired, amount);
    target.current.lerp(look, amount);
    camera.lookAt(target.current);
    if (
      camera.position.distanceTo(desired) > 0.002 ||
      target.current.distanceTo(look) > 0.002
    )
      invalidate();
  });
  return null;
}
export function destinationFrom(object: THREE.Object3D): Destination | null {
  let current: THREE.Object3D | null = object;
  while (current) {
    const d = current.userData.destination;
    if (d === "guestbook" || d === "tribute" || d === "wall") return d;
    current = current.parent;
  }
  return null;
}
function Sanctuary({
  onSelect,
  onReady,
  onProgress,
}: {
  onSelect: (v: Destination) => void;
  onReady: () => void;
  onProgress: (e: ProgressEvent) => void;
}) {
  const gltf = useLoader(
    GLTFLoader,
    "/3d/sanctuary-mobile.glb",
    (loader) => loader.setMeshoptDecoder(MeshoptDecoder),
    onProgress,
  );
  const environment = useLoader(HDRLoader, "/3d/sanctuary-light.hdr");
  const { scene, invalidate } = useThree();
  const model = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        if (
          !Array.isArray(object.material) &&
          object.material.name === "Architectural glazing"
        ) {
          object.material = new THREE.MeshStandardMaterial({
            name: "Efficient architectural glazing",
            color: "#b5c7bc",
            roughness: 0.17,
            metalness: 0.15,
            transparent: true,
            opacity: 0.13,
            depthWrite: false,
          });
          object.castShadow = false;
        }
      }
    });
    return clone;
  }, [gltf]);
  useEffect(() => {
    environment.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = environment;
    scene.environmentIntensity = 0.65;
    onReady();
    invalidate();
    return () => {
      scene.environment = null;
      document.body.style.cursor = "";
    };
  }, [environment, scene, onReady, invalidate]);
  const select = (event: ThreeEvent<MouseEvent>) => {
    const d = destinationFrom(event.object);
    if (d) {
      event.stopPropagation();
      onSelect(d);
    }
  };
  return (
    <primitive
      object={model}
      onClick={select}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        if (destinationFrom(event.object)) {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    />
  );
}
class WebGLBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
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
export default function HallScene({
  view,
  onSelect,
  reducedMotion = false,
  onFailure,
}: {
  view: Destination;
  onSelect: (v: Destination) => void;
  reducedMotion?: boolean;
  onFailure?: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const markReady = useCallback(() => {
    setReady(true);
    setProgress(100);
  }, []);
  const reportProgress = useCallback((event: ProgressEvent) => {
    if (event.lengthComputable && event.total > 0)
      setProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
  }, []);
  useEffect(() => {
    const element = canvas.current;
    const lost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
      onFailure?.();
    };
    element?.addEventListener("webglcontextlost", lost);
    return () => element?.removeEventListener("webglcontextlost", lost);
  }, [ready, onFailure]);
  const fallback = (
    <div className="scene-fallback">
      <span className="eyebrow">Every memory still has a place</span>
      <p>The 3D sanctuary is unavailable on this device.</p>
      <p>
        Use the destination controls below. The guestbook, tributes and memory
        wall remain fully available.
      </p>
    </div>
  );
  if (failed) return fallback;
  return (
    <WebGLBoundary fallback={fallback}>
      {!ready && (
        <div className="scene-loading sanctuary-loading" role="status">
          <span className="eyebrow">The Garden of Light</span>
          <p>Opening the sanctuary{progress > 0 ? ` · ${progress}%` : "…"}</p>
          <progress
            max={100}
            value={progress || undefined}
            aria-label="Sanctuary download"
          />
          <small>Preparing architecture, materials and daylight</small>
        </div>
      )}
      <Canvas
        ref={canvas}
        role="img"
        aria-label="Interactive Garden of Light memorial sanctuary. Select the guestbook, tribute lectern or memory wall, or use the labeled controls."
        shadows
        frameloop="demand"
        dpr={[1, 1.25]}
        camera={{
          position: sanctuaryViews.overview.position,
          fov: 72,
          near: 0.08,
          far: 45,
        }}
        gl={{ antialias: true, powerPreference: "low-power" }}
        fallback={fallback}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <color attach="background" args={["#a4b0a0"]} />
        <ambientLight intensity={0.25} />
        <hemisphereLight args={["#f4ead6", "#434a3b", 0.8]} />
        <directionalLight
          position={[-6, 9, 4]}
          color="#fff1d6"
          intensity={2.4}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={12}
          shadow-camera-bottom={-9}
          shadow-camera-near={0.1}
          shadow-camera-far={35}
          shadow-normalBias={0.035}
        />
        <spotLight
          position={[0, 4.6, -4.4]}
          target-position={[0, 1.5, -6.6]}
          angle={0.8}
          penumbra={1}
          intensity={35}
          distance={9}
          color="#ffdc9d"
        />
        <CameraRig view={view} reducedMotion={reducedMotion} />
        <Suspense fallback={null}>
          <Sanctuary
            onSelect={onSelect}
            onReady={markReady}
            onProgress={reportProgress}
          />
        </Suspense>
      </Canvas>
    </WebGLBoundary>
  );
}
