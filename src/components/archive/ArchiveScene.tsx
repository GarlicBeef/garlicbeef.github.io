import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { figureGeometry } from '@/lib/figures';
import type { ArchivePaper } from './Archive';

interface SceneProps {
  papers: ArchivePaper[];
  active: number | null;
  onActive: (i: number | null) => void;
  onOpen: (i: number) => void;
  onReady: () => void;
}

/* ------------------------------------------------------------------ */
/* Dimensions (scene units)                                            */
/* ------------------------------------------------------------------ */
const BOX = { w: 3.0, d: 3.5, h: 1.1, t: 0.055 };
const FILE = { w: 2.42, h: 2.85, thick: 0.075 };
const TAB = { w: 0.48, h: 0.27 };
const LEAN = -0.17; // radians, files lean back
const HEIGHTS = [0.0, 0.16, 0.06, 0.22, 0.1, 0.18];

/* ------------------------------------------------------------------ */
/* Procedural textures                                                 */
/* ------------------------------------------------------------------ */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function boardTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#c3beb5';
  g.fillRect(0, 0, 512, 512);
  const r = seeded(4);
  const img = g.getImageData(0, 0, 512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 14;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  // faint fibres
  g.globalAlpha = 0.06;
  for (let i = 0; i < 400; i++) {
    g.strokeStyle = r() > 0.5 ? '#ffffff' : '#6d675e';
    g.beginPath();
    const x = r() * 512;
    const y = r() * 512;
    g.moveTo(x, y);
    g.lineTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 8);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  return t;
}

function paperTexture(paper: ArchivePaper, index: number) {
  const W = 704;
  const H = Math.round((W * FILE.h) / FILE.w);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const r = seeded(index + 11);

  // paper ground
  g.fillStyle = '#efe9dc';
  g.fillRect(0, 0, W, H);
  const img = g.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 9;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n - 1;
  }
  g.putImageData(img, 0, 0);
  const vg = g.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.85);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(90,70,40,0.10)');
  g.fillStyle = vg;
  g.fillRect(0, 0, W, H);

  const ink = 'rgba(40,38,34,0.85)';
  const soft = 'rgba(40,38,34,0.28)';
  const M = 56;

  // header: abstract text lines (not real words)
  g.fillStyle = soft;
  for (let i = 0; i < 3; i++) g.fillRect(M, 48 + i * 15, (W - 2 * M) * (0.35 + r() * 0.4), 5);
  g.font = '500 15px ui-monospace, Menlo, monospace';
  g.fillStyle = ink;
  g.textAlign = 'right';
  g.fillText(`No. ${paper.number}`, W - M, 56);
  g.textAlign = 'left';

  // figure box
  const fx = M + 26;
  const fy = 120;
  const fw = W - 2 * M - 40;
  const fh = H * 0.48;
  g.strokeStyle = ink;
  g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(fx, fy);
  g.lineTo(fx, fy + fh);
  g.lineTo(fx + fw, fy + fh);
  g.stroke();
  g.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const tx = fx + (i * fw) / 5;
    const ty = fy + (i * fh) / 5;
    g.beginPath();
    g.moveTo(tx, fy + fh);
    g.lineTo(tx, fy + fh + 6);
    g.moveTo(fx, ty);
    g.lineTo(fx - 6, ty);
    g.stroke();
  }
  const geo = figureGeometry(paper.figureKind, index + 1);
  const X = (x: number) => fx + 8 + x * (fw - 16);
  const Y = (y: number) => fy + fh - 8 - y * (fh - 16);
  for (const l of geo.lines) {
    g.lineWidth = l.weight * 1.5;
    g.setLineDash(l.dashed ? [6, 6] : []);
    g.beginPath();
    l.points.forEach(([x, y], k) => (k ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
    g.stroke();
  }
  g.setLineDash([]);
  g.fillStyle = ink;
  for (const [x, y] of geo.dots) {
    g.beginPath();
    g.arc(X(x), Y(y), 2.3, 0, Math.PI * 2);
    g.fill();
  }
  g.font = '13px ui-monospace, Menlo, monospace';
  g.fillStyle = soft;
  g.fillText('FIG. — ILLUSTRATIVE PLACEHOLDER', fx, fy + fh + 34);

  // body text lines
  g.fillStyle = soft;
  let y = fy + fh + 64;
  while (y < H - 50) {
    const para = 3 + Math.floor(r() * 4);
    for (let k = 0; k < para && y < H - 50; k++) {
      const last = k === para - 1;
      g.fillRect(M, y, (W - 2 * M) * (last ? 0.3 + r() * 0.4 : 0.92 + r() * 0.08), 4.5);
      y += 15;
    }
    y += 12;
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function tabTexture(label: string) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 144;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1c1c1b';
  g.fillRect(0, 0, 256, 144);
  g.fillStyle = '#f3f1ea';
  g.font = '400 76px "Geist Variable", Helvetica, Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(label, 128, 78);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */
function ArchiveBox() {
  const board = useMemo(() => boardTexture(), []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ece8e1', map: board, roughness: 0.93, metalness: 0 }),
    [board],
  );
  const inner = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d6d1c8', map: board, roughness: 0.95 }), [board]);
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7d7b77', roughness: 0.38, metalness: 0.75 }), []);
  const card = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ece7da', roughness: 0.9 }), []);
  const { w, d, h, t } = BOX;

  const wall = (pos: [number, number, number], size: [number, number, number], m = mat) => (
    <mesh position={pos} castShadow receiveShadow material={[m, m, m, m, m, m]}>
      <boxGeometry args={size} />
    </mesh>
  );

  return (
    <group>
      {wall([0, t / 2, 0], [w, t, d], inner)}
      {wall([0, h / 2, d / 2 - t / 2], [w, h, t])}
      {wall([0, h / 2, -d / 2 + t / 2], [w, h, t])}
      {wall([-w / 2 + t / 2, h / 2, 0], [t, h, d - 2 * t])}
      {wall([w / 2 - t / 2, h / 2, 0], [t, h, d - 2 * t])}
      {/* label holder on the front face */}
      <group position={[0, h * 0.47, d / 2 + 0.004]}>
        <mesh position={[0, 0, 0.012]} material={card} receiveShadow>
          <boxGeometry args={[0.78, 0.3, 0.01]} />
        </mesh>
        {[
          [0, 0.17, 0.92, 0.045],
          [0, -0.17, 0.92, 0.045],
          [-0.44, 0, 0.045, 0.385],
          [0.44, 0, 0.045, 0.385],
        ].map(([x, y, sw, sh], i) => (
          <mesh key={i} position={[x, y, 0.022]} material={metal} castShadow>
            <boxGeometry args={[sw, sh, 0.022]} />
          </mesh>
        ))}
        {[-0.52, 0.52].map((x) => (
          <mesh key={x} position={[x, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]} material={metal}>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 20]} />
          </mesh>
        ))}
      </group>
      {/* rivet at the corner */}
      <mesh position={[-w / 2 + 0.12, h * 0.25, d / 2 + 0.006]} rotation={[Math.PI / 2, 0, 0]} material={metal}>
        <cylinderGeometry args={[0.045, 0.045, 0.012, 24]} />
      </mesh>
    </group>
  );
}

interface FileProps {
  paper: ArchivePaper;
  index: number;
  count: number;
  active: boolean;
  dimmed: boolean;
  onActive: SceneProps['onActive'];
  onOpen: SceneProps['onOpen'];
}

function Dossier({ paper, index, count, active, dimmed, onActive, onOpen }: FileProps) {
  const ref = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const front = useMemo(() => paperTexture(paper, index), [paper, index]);
  const tab = useMemo(() => tabTexture(paper.number), [paper.number]);

  const mats = useMemo(() => {
    const edge = new THREE.MeshStandardMaterial({ color: '#e7e0cf', roughness: 0.95 });
    const face = new THREE.MeshStandardMaterial({ map: front, roughness: 0.88 });
    const cover = new THREE.MeshStandardMaterial({ color: '#e2d9c3', roughness: 0.9 });
    const tabM = new THREE.MeshStandardMaterial({ color: '#1c1c1b', roughness: 0.6 });
    const tabFace = new THREE.MeshStandardMaterial({ map: tab, roughness: 0.6 });
    return { edge, face, cover, tabM, tabFace };
  }, [front, tab]);

  // Base pose: spaced from the front of the box to the back.
  const spacing = (BOX.d - 0.7) / Math.max(1, count - 1);
  const baseZ = BOX.d / 2 - 0.42 - index * spacing;
  const baseY = BOX.t + HEIGHTS[index % HEIGHTS.length];
  const tabX = -FILE.w / 2 + TAB.w / 2 + 0.12 + (index * (FILE.w * 0.42)) / Math.max(1, count - 1);

  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    const dur = 0.38;
    const tl = gsap.timeline({ onUpdate: invalidate, defaults: { duration: dur, ease: 'power2.out', overwrite: 'auto' } });
    tl.to(g.position, { y: baseY + (active ? 0.5 : 0), z: baseZ + (active ? 0.22 : 0) }, 0);
    tl.to(g.rotation, { x: active ? LEAN * 0.55 : LEAN }, 0);
    mats.face.color.set(dimmed ? '#ece8df' : '#ffffff');
    invalidate();
    return () => {
      tl.kill();
    };
  }, [active, dimmed, baseY, baseZ, invalidate, mats]);

  useEffect(
    () => () => {
      front.dispose();
      tab.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    },
    [front, tab, mats],
  );

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onActive(index);
    document.body.style.cursor = 'pointer';
  };
  const out = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = '';
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // On touch, the first tap previews; a second tap opens.
    const touch = (e.nativeEvent as PointerEvent).pointerType === 'touch';
    if (touch && !active) {
      onActive(index);
      return;
    }
    onOpen(index);
  };

  const { w, h, thick } = FILE;
  return (
    <group ref={ref} position={[0, baseY, baseZ]} rotation={[LEAN, 0, 0]} onPointerOver={over} onPointerOut={out} onClick={click}>
      {/* back cover */}
      <mesh position={[0, h / 2, -thick / 2 - 0.006]} material={mats.cover} castShadow receiveShadow>
        <boxGeometry args={[w + 0.02, h, 0.012]} />
      </mesh>
      {/* paper block: the front face carries the printed sheet */}
      <mesh
        position={[0, h / 2 - 0.03, 0]}
        material={[mats.edge, mats.edge, mats.edge, mats.edge, mats.face, mats.edge]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[w - 0.05, h - 0.06, thick]} />
      </mesh>
      {/* tab */}
      <group position={[tabX, h + TAB.h / 2 - 0.02, -thick / 2 - 0.006]}>
        <mesh material={[mats.tabM, mats.tabM, mats.tabM, mats.tabM, mats.tabFace, mats.tabM]} castShadow>
          <boxGeometry args={[TAB.w, TAB.h, 0.014]} />
        </mesh>
      </group>
    </group>
  );
}

function Scene({ papers, active, onActive, onOpen }: Omit<SceneProps, 'onReady'>) {
  return (
    <>
      <hemisphereLight args={['#ffffff', '#e4dfd5', 1.5]} />
      <directionalLight
        position={[3.2, 7.5, 5.5]}
        intensity={1.7}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={8}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={1}
        shadow-camera-far={20}
      />
      <directionalLight position={[-5, 2.5, 4]} intensity={0.45} />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={1.4} position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer intensity={0.6} position={[-6, 2, 3]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer intensity={0.4} color="#fff3e2" position={[6, 2, -2]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} />
      </Environment>

      <group position={[0, 0, 0]} onPointerLeave={() => onActive(null)}>
        <ArchiveBox />
        {papers.map((p, i) => (
          <Dossier
            key={p.id}
            paper={p}
            index={i}
            count={papers.length}
            active={active === i}
            dimmed={active !== null && active !== i}
            onActive={onActive}
            onOpen={onOpen}
          />
        ))}
      </group>
      <ContactShadows position={[0, 0.001, 0]} scale={9} resolution={1024} far={2.2} blur={2.6} opacity={0.42} color="#3b362e" />
    </>
  );
}

export default function ArchiveScene({ papers, active, onActive, onOpen, onReady }: SceneProps) {
  return (
    <Canvas
      frameloop="demand"
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, 2]}
      camera={{ position: [6.4, 3.9, 7.6], fov: 25, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping, powerPreference: 'low-power' }}
      onCreated={({ camera, invalidate }) => {
        camera.lookAt(-0.25, 1.15, -0.4);
        invalidate();
        requestAnimationFrame(onReady);
      }}
      onPointerMissed={() => onActive(null)}
    >
      <Scene papers={papers} active={active} onActive={onActive} onOpen={onOpen} />
    </Canvas>
  );
}
