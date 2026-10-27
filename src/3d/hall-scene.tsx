"use client";

import {
  Canvas,
  useFrame,
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

export type Destination = "overview" | "guestbook" | "tribute" | "wall";
const cameras: Record<
  Destination,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  overview: { position: [8.8, 7.5, 12.8], target: [0, 1.5, -1] },
  guestbook: { position: [-3.3, 3.7, 4.2], target: [-2.6, 1.25, 0.5] },
  tribute: { position: [5, 3.2, 3.6], target: [2.8, 1.4, -0.5] },
  wall: { position: [4, 3.3, 1.5], target: [2.9, 2.1, -4.9] },
};

function CameraRig({
  view,
  reducedMotion,
}: {
  view: Destination;
  reducedMotion: boolean;
}) {
  const { camera, size, invalidate } = useThree();
  const target = useRef(new THREE.Vector3(0, 1.5, -1));
  useEffect(() => {
    invalidate();
  }, [view, reducedMotion, invalidate, size]);
  useFrame((_, delta) => {
    const config = cameras[view];
    const mobile = size.width < 600 && view === "overview";
    const desired = new THREE.Vector3(...config.position).multiplyScalar(
      mobile ? 1.15 : 1,
    );
    const look = new THREE.Vector3(...config.target);
    const amount = reducedMotion ? 1 : 1 - Math.exp(-Math.min(delta, 0.05) * 4);
    camera.position.lerp(desired, amount);
    target.current.lerp(look, amount);
    camera.lookAt(target.current);
    if (
      camera.position.distanceTo(desired) > 0.005 ||
      target.current.distanceTo(look) > 0.005
    )
      invalidate();
  });
  return null;
}

function Block({
  position,
  size,
  color,
  ...rest
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} receiveShadow castShadow {...rest}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.82} />
    </mesh>
  );
}

function Hotspot({
  position,
  onClick,
  children,
  number,
}: {
  position: [number, number, number];
  onClick: () => void;
  children: ReactNode;
  number: string;
}) {
  const [hover, setHover] = useState(false);
  const marker = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#28392e";
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d9c49a";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#faf4e5";
    ctx.font = "38px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(number, 64, 66);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [number]);
  useEffect(() => () => marker.dispose(), [marker]);
  return (
    <group
      position={position}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onClick();
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
    >
      {children}
      <sprite
        position={[0, 2.05, 0]}
        scale={hover ? [0.8, 0.8, 1] : [0.66, 0.66, 1]}
      >
        <spriteMaterial map={marker} transparent depthTest={false} />
      </sprite>
      <mesh position={[0, 0.3, 0]} visible={false}>
        <boxGeometry args={[1.8, 2.5, 1.8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

function Scene({
  onSelect,
  view,
  reducedMotion,
  onReady,
}: {
  onSelect: (view: Destination) => void;
  view: Destination;
  reducedMotion: boolean;
  onReady: () => void;
}) {
  const portrait = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#d6d3bc";
    ctx.fillRect(0, 0, 256, 320);
    ctx.fillStyle = "#f1e7cd";
    ctx.beginPath();
    ctx.arc(175, 94, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7f907a";
    ctx.beginPath();
    ctx.moveTo(0, 232);
    ctx.quadraticCurveTo(120, 116, 256, 228);
    ctx.lineTo(256, 320);
    ctx.lineTo(0, 320);
    ctx.fill();
    ctx.fillStyle = "#e3d7bb";
    ctx.beginPath();
    ctx.moveTo(0, 280);
    ctx.quadraticCurveTo(150, 200, 256, 270);
    ctx.lineTo(256, 320);
    ctx.lineTo(0, 320);
    ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
  useEffect(() => {
    onReady();
    return () => portrait.dispose();
  }, [onReady, portrait]);
  return (
    <>
      <color attach="background" args={["#e8e6dd"]} />
      <fog attach="fog" args={["#e8e6dd", 24, 48]} />
      <ambientLight intensity={1.2} />
      <hemisphereLight args={["#fff8e7", "#7b8572", 1.3]} />
      <directionalLight
        position={[-5, 10, 5]}
        intensity={3.2}
        color="#fff3d8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.001}
      />
      <CameraRig view={view} reducedMotion={reducedMotion} />
      <Block position={[0, -0.25, -0.5]} size={[12, 0.5, 11]} color="#c6bca6" />
      <Block
        position={[0, -0.04, -0.5]}
        size={[11.7, 0.1, 10.7]}
        color="#e2dac9"
      />
      {/* Back wall with a central portrait recess, open facade and colonnade. */}
      <Block
        position={[-4.1, 2.6, -5.3]}
        size={[3.8, 5.4, 0.45]}
        color="#dbd4c3"
      />
      <Block
        position={[4.1, 2.6, -5.3]}
        size={[3.8, 5.4, 0.45]}
        color="#dbd4c3"
      />
      <Block position={[0, 4.8, -5.3]} size={[4.4, 1, 0.45]} color="#dbd4c3" />
      <Block
        position={[0, 2.3, -5.65]}
        size={[4.4, 4.2, 0.35]}
        color="#a7ad9b"
      />
      {[-5.7, 5.7].map((x) => (
        <group key={x}>
          {[-4.8, -1.7, 1.4, 4].map((z) => (
            <group key={z}>
              <Block
                position={[x, 2.3, z]}
                size={[0.42, 4.6, 0.42]}
                color="#d4cbb8"
              />
              <Block
                position={[x, 4.65, z]}
                size={[0.62, 0.2, 0.62]}
                color="#ded5c3"
              />
            </group>
          ))}
          <Block
            position={[x, 4.8, -0.4]}
            size={[0.55, 0.4, 10.4]}
            color="#d7cdb9"
          />
        </group>
      ))}
      {[-4.7, -3.1, -1.5, 0.1, 1.7, 3.3, 4.9].map((x) => (
        <Block
          key={x}
          position={[x, 5, -0.6]}
          size={[0.12, 0.18, 10.6]}
          color="#b6aa8e"
        />
      ))}
      {[-4, -2, 0, 2, 4].map((x) => (
        <Block
          key={x}
          position={[x, 0.02, -0.6]}
          size={[0.014, 0.015, 10]}
          color="#c7beaa"
        />
      ))}
      <Block
        position={[0, 0.65, -4.25]}
        size={[2.7, 1.3, 1.2]}
        color="#d5c9b3"
      />
      <Block
        position={[0, 1.35, -4.25]}
        size={[2.9, 0.13, 1.35]}
        color="#bca275"
      />
      <Block
        position={[0, 2.8, -5.04]}
        size={[1.9, 2.5, 0.13]}
        color="#b79d70"
      />
      <mesh position={[0, 2.8, -4.96]}>
        <planeGeometry args={[1.72, 2.32]} />
        <meshStandardMaterial map={portrait} roughness={1} />
      </mesh>
      <Hotspot
        number="01"
        position={[-2.8, 0, 1.1]}
        onClick={() => onSelect("guestbook")}
      >
        <Block position={[0, 1.1, 0]} size={[2, 0.16, 1.05]} color="#8a6e4b" />
        {[-0.8, 0.8].map((x) => (
          <Block
            key={x}
            position={[x, 0.55, 0]}
            size={[0.15, 1.1, 0.75]}
            color="#675b46"
          />
        ))}
        <Block
          position={[0, 1.22, 0]}
          size={[1.1, 0.07, 0.64]}
          color="#f7f0dc"
          rotation={[-0.05, 0, 0]}
        />
        <Block
          position={[0, 1.27, 0]}
          size={[0.018, 0.02, 0.62]}
          color="#bda985"
        />
      </Hotspot>
      <Hotspot
        number="02"
        position={[2.9, 0, -0.6]}
        onClick={() => onSelect("tribute")}
      >
        <Block position={[0, 0.7, 0]} size={[0.38, 1.4, 0.4]} color="#aa8e62" />
        <Block position={[0, 0.12, 0]} size={[1, 0.17, 0.8]} color="#8a7656" />
        <Block
          position={[0, 1.5, 0]}
          size={[1.25, 0.14, 0.85]}
          color="#8b7350"
          rotation={[0.18, 0, 0]}
        />
        <Block
          position={[0, 1.6, 0]}
          size={[0.7, 0.02, 0.56]}
          color="#f1e8d4"
          rotation={[0.18, 0, 0]}
        />
      </Hotspot>
      <Hotspot
        number="03"
        position={[2.9, 1.45, -4.98]}
        onClick={() => onSelect("wall")}
      >
        <Block position={[0, 0.6, 0]} size={[1.8, 1.9, 0.12]} color="#b7a681" />
        <Block
          position={[0, 0.6, 0.08]}
          size={[1.62, 1.72, 0.04]}
          color="#eee7d5"
        />
        {[0.3, 0.55, 0.8, 1.05].map((y, i) => (
          <Block
            key={y}
            position={[i === 3 ? -0.2 : 0, y, 0.12]}
            size={[i === 3 ? 0.65 : 1.1, 0.027, 0.015]}
            color="#a19d87"
          />
        ))}
      </Hotspot>
      {[-4.7, 4.6].map((x) => (
        <group key={x} position={[x, 0, -3.8]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.29, 0.8, 16]} />
            <meshStandardMaterial color="#aa9e85" />
          </mesh>
          <mesh position={[0, 1.2, 0]} castShadow>
            <sphereGeometry args={[0.67, 12, 12]} />
            <meshStandardMaterial color="#71806b" roughness={1} />
          </mesh>
          <mesh position={[0.26, 1.7, 0.08]} castShadow>
            <sphereGeometry args={[0.4, 12, 12]} />
            <meshStandardMaterial color="#88937b" roughness={1} />
          </mesh>
        </group>
      ))}
    </>
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
  onSelect: (view: Destination) => void;
  reducedMotion?: boolean;
  onFailure?: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const markReady = useCallback(() => setReady(true), []);
  useEffect(() => {
    const canvas = canvasRef.current;
    const lost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
      onFailure?.();
    };
    canvas?.addEventListener("webglcontextlost", lost);
    return () => canvas?.removeEventListener("webglcontextlost", lost);
  }, [ready, onFailure]);
  const fallback = (
    <div className="scene-fallback">
      <span className="eyebrow">A lighter way to visit</span>
      <p>The 3D hall is unavailable on this device.</p>
      <p>Use the destination buttons to visit every part of the memorial.</p>
    </div>
  );
  if (failed) return fallback;
  return (
    <WebGLBoundary fallback={fallback}>
      {!ready && (
        <div className="scene-loading" role="status">
          Opening the hall…
        </div>
      )}
      <Canvas
        role="img"
        ref={canvasRef}
        shadows
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{
          position: cameras.overview.position,
          fov: 42,
          near: 0.1,
          far: 80,
        }}
        gl={{ antialias: true, powerPreference: "low-power" }}
        fallback={fallback}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
        aria-label="Interactive architectural memorial hall. Use the labeled destination buttons for keyboard navigation."
      >
        <Suspense fallback={null}>
          <Scene
            view={view}
            onSelect={onSelect}
            reducedMotion={reducedMotion}
            onReady={markReady}
          />
        </Suspense>
      </Canvas>
    </WebGLBoundary>
  );
}
