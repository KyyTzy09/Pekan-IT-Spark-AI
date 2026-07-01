"use client";

import { OrbitControls, Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  Flame,
  Flower2,
  Lightbulb,
  Shield,
  Sparkles as SparklesIcon,
  Sprout,
  Star,
  Target,
  TreePine,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import type { Group, Mesh } from "three";

// ============================================================================
// Types
// ============================================================================

type SubjectInfo = {
  name: string;
  icon: string | null;
  color: string | null;
  masteryPct: number;
  masteredConcepts: number;
  totalConcepts: number;
  learningConcepts: number;
  strugglingConcepts: number;
};

type RecommendationInfo = {
  conceptName: string;
  subjectName: string;
  reason: string;
  status: "NOT_STARTED" | "LEARNING" | "MASTERED" | "STRUGGLING";
  masteryScore: number;
};

type Props = {
  studentName: string;
  level: number;
  levelName: string;
  totalXp: number;
  levelProgress: number;
  xpToNext: number | null;
  totalMastered: number;
  totalConcepts: number;
  avgMasteryPct: number;
  totalAttempts: number;
  streakCurrent: number;
  streakLongest: number;
  streakFreeze: number;
  subjects: SubjectInfo[];
  recommendation: RecommendationInfo | null;
  sparkTip: string;
  buddyType: string;
  buddyStage: number;
};

// ============================================================================
// Constants
// ============================================================================

const STAGE_THRESHOLDS = [5, 15, 30];
const STAGE_NAMES = ["Bibit 🌱", "Kecambah 🌿", "Dewasa 🌳", "Raksasa 🌲"];
const STAGE_DESCRIPTIONS = [
  "Pohonmu baru mulai tumbuh. Terus belajar untuk melihatnya membesar!",
  "Kecambahmu mulai kuat. Cabang-cabang baru bermunculan!",
  "Pohonmu sudah dewasa dan rimbun. Penguasaan kamu makin mantap!",
  "Pohon raksasa! Kamu sudah jadi master sejati. Luar biasa!",
];

const BUDDY_THEMES: Record<
  string,
  {
    label: string;
    canopy: string;
    accent: string;
    glow: string;
    leafColors: string[];
  }
> = {
  bunga: {
    label: "🌸 Bunga",
    canopy: "#4ade80",
    accent: "#22c55e",
    glow: "#86efac",
    leafColors: [
      "#4ade80",
      "#22c55e",
      "#86efac",
      "#16a34a",
      "#84cc16",
      "#a3e635",
    ],
  },
  kaktus: {
    label: "🌵 Kaktus",
    canopy: "#2dd4bf",
    accent: "#14b8a6",
    glow: "#5eead4",
    leafColors: [
      "#2dd4bf",
      "#14b8a6",
      "#5eead4",
      "#0d9488",
      "#0f766e",
      "#99f6e4",
    ],
  },
  bonsai: {
    label: "🎋 Bonsai",
    canopy: "#34d399",
    accent: "#10b981",
    glow: "#6ee7b7",
    leafColors: [
      "#34d399",
      "#10b981",
      "#6ee7b7",
      "#059669",
      "#047857",
      "#a7f3d0",
    ],
  },
  beringin: {
    label: "🌳 Beringin",
    canopy: "#a3e635",
    accent: "#84cc16",
    glow: "#bef264",
    leafColors: [
      "#a3e635",
      "#84cc16",
      "#bef264",
      "#4d7c0f",
      "#65a30d",
      "#d9f99d",
    ],
  },
};

const MILESTONE_LEVELS = [
  { level: 5, name: "Kecambah", icon: "🌿" },
  { level: 10, name: "Tunas Muda", icon: "🌱" },
  { level: 15, name: "Pohon Kecil", icon: "🌿" },
  { level: 20, name: "Pohon Muda", icon: "🌴" },
  { level: 30, name: "Pohon Dewasa", icon: "🌳" },
  { level: 40, name: "Pohon Tua", icon: "🌲" },
  { level: 50, name: "Pohon Raksasa", icon: "🏔️" },
];

function getStage(level: number): number {
  if (level <= STAGE_THRESHOLDS[0]) return 1;
  if (level <= STAGE_THRESHOLDS[1]) return 2;
  if (level <= STAGE_THRESHOLDS[2]) return 3;
  return 4;
}

// ============================================================================
// 3D Components
// ============================================================================

function AnimatedTrunk({ height, radius }: { height: number; radius: number }) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle sway in the wind
      meshRef.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 0.3) * 0.01;
    }
  });

  return (
    <mesh ref={meshRef} position-y={height / 2}>
      <cylinderGeometry args={[radius * 0.65, radius * 1.1, height, 16]} />
      <meshStandardMaterial color="#5C3D24" roughness={0.9} metalness={0.02} />
    </mesh>
  );
}

function TreeRoots({ trunkRadius }: { trunkRadius: number }) {
  const roots = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const angle = (i * Math.PI) / 2 + 0.3; // 4 directions
      const length = trunkRadius * 2.5;
      const thickness = trunkRadius * 0.75;
      return {
        position: [
          Math.cos(angle) * trunkRadius * 0.5,
          0.04,
          Math.sin(angle) * trunkRadius * 0.5,
        ] as [number, number, number],
        rotation: [0.12, -angle, 0.45] as [number, number, number], // tilted outward
        length,
        thickness,
      };
    });
  }, [trunkRadius]);

  return (
    <>
      {roots.map((r, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: stable procedural 3D mesh array
        <mesh key={i} position={r.position} rotation={r.rotation}>
          <cylinderGeometry
            args={[r.thickness * 0.3, r.thickness * 1.2, r.length, 8]}
          />
          <meshStandardMaterial color="#4E3629" roughness={0.9} />
        </mesh>
      ))}
    </>
  );
}

function AnimatedBranches({
  count,
  trunkHeight,
  trunkRadius,
}: {
  count: number;
  trunkHeight: number;
  trunkRadius: number;
}) {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.008;
    }
  });

  const branches = useMemo(() => {
    const result: Array<{
      position: [number, number, number];
      rotation: [number, number, number];
      length: number;
      thickness: number;
    }> = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / Math.max(count, 1)) * Math.PI * 2 + i * 0.7;
      const heightFraction = 0.35 + (i % 4) * 0.12;
      const y = trunkHeight * heightFraction;
      const length = trunkHeight * 0.22 + i * 0.03 * trunkHeight * 0.12;
      const tilt = Math.PI / 4 + i * 0.025 * 0.35;
      const thickness = trunkRadius * (0.35 - i * 0.01);

      result.push({
        position: [
          Math.cos(angle) * trunkRadius,
          y,
          Math.sin(angle) * trunkRadius,
        ],
        rotation: [Math.sin(angle) * tilt, 0, Math.cos(angle) * tilt],
        length,
        thickness: Math.max(thickness, trunkRadius * 0.12),
      });
    }
    return result;
  }, [count, trunkHeight, trunkRadius]);

  return (
    <group ref={groupRef}>
      {branches.map((b, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: stable procedural 3D mesh array
        <mesh key={i} position={b.position} rotation={b.rotation}>
          <cylinderGeometry
            args={[b.thickness * 0.5, b.thickness, b.length, 8]}
          />
          <meshStandardMaterial
            color="#7A5230"
            roughness={0.82}
            metalness={0.03}
          />
        </mesh>
      ))}
    </group>
  );
}

function AnimatedCanopy({
  leafCount,
  trunkHeight,
  leafColors,
  stage,
}: {
  leafCount: number;
  trunkHeight: number;
  leafColors: string[];
  stage: number;
}) {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Wind swaying effect
      groupRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.7) * 0.015;
      groupRef.current.rotation.z =
        Math.cos(state.clock.elapsedTime * 0.5) * 0.012;
    }
  });

  const leaves = useMemo(() => {
    if (leafCount <= 0) return [];
    // Scale canopy radius with trunk height so it looks proportional
    const canopyRadius = Math.max(0.6, 0.4 + trunkHeight * 0.25);
    const canopyY = trunkHeight + canopyRadius * 0.25;
    const rng = mulberry32(stage * 1000 + leafCount);

    return Array.from({ length: leafCount }, (_, idx) => {
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      const r = canopyRadius * (0.4 + rng() * 0.6);
      const size = 0.1 + rng() * 0.2; // smaller leaves for seedling
      // Vary green tones for organic look
      const colorShift = rng() * 0.15;
      const leafColor = leafColors[Math.floor(rng() * leafColors.length)];

      return {
        id: `leaf-${idx}`,
        position: [
          r * Math.sin(phi) * Math.cos(theta),
          canopyY + r * Math.cos(phi) * 0.55,
          r * Math.sin(phi) * Math.sin(theta),
        ] as [number, number, number],
        size,
        color: leafColor,
        colorShift,
      };
    });
  }, [leafCount, trunkHeight, stage, leafColors]);

  return (
    <group ref={groupRef}>
      {leaves.map((leaf) => (
        <mesh key={leaf.id} position={leaf.position}>
          <sphereGeometry args={[leaf.size, 6, 4]} />
          <meshStandardMaterial
            color={leaf.color}
            roughness={0.6 + leaf.colorShift}
            metalness={0.05}
            transparent
            opacity={0.85 + leaf.colorShift}
          />
        </mesh>
      ))}
    </group>
  );
}

function GroundPlane({
  stage,
  progressFactor,
}: {
  stage: number;
  progressFactor: number;
}) {
  const grassCount = Math.round((10 + stage * 15) * progressFactor);
  const groundRadius = 6 + progressFactor * 4; // 6 → 10

  const grasses = useMemo(() => {
    const rng = mulberry32(42);
    return Array.from({ length: grassCount }, (_, idx) => {
      const angle = rng() * Math.PI * 2;
      const dist = 1.5 + rng() * 4;
      const height = 0.12 + rng() * 0.2;
      return {
        id: `grass-${idx}`,
        position: [
          Math.cos(angle) * dist,
          height / 2,
          Math.sin(angle) * dist,
        ] as [number, number, number],
        height,
        scale: 0.8 + rng() * 0.5,
      };
    });
  }, [grassCount]);

  const pebbles = useMemo(() => {
    const rng = mulberry32(888);
    const count = 3 + stage * 2;
    return Array.from({ length: count }, (_, idx) => {
      const angle = rng() * Math.PI * 2;
      const dist = 1.0 + rng() * 2.2;
      return {
        id: `pebble-${idx}`,
        position: [Math.cos(angle) * dist, 0.05, Math.sin(angle) * dist] as [
          number,
          number,
          number,
        ],
        scale: [
          0.12 + rng() * 0.15,
          0.06 + rng() * 0.08,
          0.1 + rng() * 0.15,
        ] as [number, number, number],
        rotation: [rng() * 0.5, rng() * Math.PI, rng() * 0.5] as [
          number,
          number,
          number,
        ],
      };
    });
  }, [stage]);

  return (
    <group>
      {/* Outer ground — wide soft terrain */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.08}>
        <circleGeometry args={[groundRadius, 48]} />
        <meshStandardMaterial color="#3d8b4f" roughness={0.95} />
      </mesh>
      {/* Middle ground layer */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.04}>
        <circleGeometry args={[groundRadius * 0.7, 48]} />
        <meshStandardMaterial color="#4a9e5c" roughness={0.92} />
      </mesh>
      {/* Inner fertile soil ring */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01}>
        <circleGeometry args={[1.8 + progressFactor * 1.5, 48]} />
        <meshStandardMaterial color="#5cb870" roughness={0.88} />
      </mesh>
      {/* Dirt patch around trunk */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.005}>
        <ringGeometry args={[0, 0.6 + progressFactor * 0.4, 24]} />
        <meshStandardMaterial color="#8B6914" roughness={0.95} />
      </mesh>
      {/* Terrain bumps (small hills) */}
      {[
        {
          pos: [2.5, 0.06, 1.5] as [number, number, number],
          scale: [1.8, 0.15, 1.5] as [number, number, number],
          color: "#4a9e5c",
        },
        {
          pos: [-2, 0.04, -2] as [number, number, number],
          scale: [1.5, 0.1, 1.2] as [number, number, number],
          color: "#3d8b4f",
        },
        {
          pos: [1, 0.03, -2.8] as [number, number, number],
          scale: [2, 0.08, 1.5] as [number, number, number],
          color: "#4a9e5c",
        },
        {
          pos: [-3, 0.05, 1] as [number, number, number],
          scale: [1.2, 0.12, 1] as [number, number, number],
          color: "#3d8b4f",
        },
      ].map((hill, i) => (
        <mesh key={`hill-${i}`} position={hill.pos} scale={hill.scale}>
          <sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={hill.color} roughness={0.9} />
        </mesh>
      ))}
      {/* Small grass blades */}
      {grasses.map((g) => (
        <mesh
          key={g.id}
          position={g.position}
          scale={[0.03 * g.scale, 1, 0.03 * g.scale]}
        >
          <cylinderGeometry args={[0.02, 0.05, g.height, 4]} />
          <meshStandardMaterial color="#3d8b4f" roughness={0.9} />
        </mesh>
      ))}
      {/* Pebbles / Rocks */}
      {pebbles.map((p) => (
        <mesh
          key={p.id}
          position={p.position}
          scale={p.scale}
          rotation={p.rotation}
        >
          <sphereGeometry args={[1, 5, 4]} />
          <meshStandardMaterial color="#8a8a8a" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Flowers({ stage }: { stage: number }) {
  const flowers = useMemo(() => {
    const count = Math.max(2, Math.min(8, stage * 2)); // min 2 flowers even at stage 1
    const rng = mulberry32(777);
    const colors = ["#f472b6", "#fb923c", "#a78bfa", "#fbbf24", "#f87171"];
    return Array.from({ length: count }, () => {
      const angle = rng() * Math.PI * 2;
      const dist = 1.8 + rng() * 3;
      return {
        position: [Math.cos(angle) * dist, 0.15, Math.sin(angle) * dist] as [
          number,
          number,
          number,
        ],
        color: colors[Math.floor(rng() * colors.length)],
        size: 0.08 + rng() * 0.1,
      };
    });
  }, [stage]);

  return (
    <>
      {flowers.map((f, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: stable procedural 3D mesh array
        <mesh key={i} position={f.position}>
          <sphereGeometry args={[f.size, 6, 4]} />
          <meshStandardMaterial
            color={f.color}
            emissive={f.color}
            emissiveIntensity={0.2}
            roughness={0.4}
          />
        </mesh>
      ))}
    </>
  );
}

function TreeScene({
  totalXp,
  totalMastered,
  avgMasteryPct,
  buddyType,
  stage,
}: {
  totalXp: number;
  totalMastered: number;
  avgMasteryPct: number;
  buddyType: string;
  stage: number;
}) {
  const theme = BUDDY_THEMES[buddyType] ?? BUDDY_THEMES.bunga;
  // Scale tree size based on actual progress — new users get a tiny seedling
  const progressFactor = Math.min(1, (totalXp + totalMastered * 50) / 500); // 0 = baru daftar, 1 = cukup aktif
  const trunkHeight = 0.4 + progressFactor * 7.6; // 0.4 (bibit) → 8 (pohon besar)
  const trunkRadius = 0.05 + progressFactor * 0.3; // 0.05 (tipis) → 0.35 (tebal)
  const branchCount =
    totalMastered > 0 ? Math.min(totalMastered, 14) : stage >= 2 ? 1 : 0;
  // Minimum leaves per stage — kecambah HARUS punya daun
  const minLeavesByStage = [3, 10, 25, 50]; // stage 1=3, stage 2=10, stage 3=25, stage 4=50
  const baseLeafCount =
    totalMastered > 0 ? Math.round(10 + (avgMasteryPct / 100) * 90) : 0;
  const leafCount = Math.max(baseLeafCount, minLeavesByStage[stage - 1] ?? 3);

  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight color="#bae6fd" groundColor="#14532d" intensity={0.4} />
      <directionalLight position={[6, 10, 4]} intensity={1.0} />
      <directionalLight
        position={[-4, 6, -3]}
        intensity={0.3}
        color="#b4d4ff"
      />
      <pointLight
        position={[0, trunkHeight + 3, 0]}
        intensity={0.4}
        color={theme.glow}
      />

      <group>
        <GroundPlane stage={stage} progressFactor={progressFactor} />
        <Flowers stage={stage} />
        <TreeRoots trunkRadius={trunkRadius} />

        <AnimatedTrunk height={trunkHeight} radius={trunkRadius} />

        <AnimatedBranches
          count={branchCount}
          trunkHeight={trunkHeight}
          trunkRadius={trunkRadius}
        />

        <AnimatedCanopy
          leafCount={leafCount}
          trunkHeight={trunkHeight}
          leafColors={theme.leafColors}
          stage={stage}
        />

        {/* Sparkle particles around the canopy — only show if tree has leaves */}
        {leafCount > 0 && (
          <>
            <Sparkles
              count={Math.round((20 + stage * 20) * progressFactor)}
              scale={[6, trunkHeight + 4, 6]}
              position={[0, trunkHeight / 2 + 1, 0]}
              size={1.5}
              speed={0.4}
              color={theme.glow}
              opacity={0.6}
            />

            {/* Dynamic rising sparkles */}
            <Sparkles
              count={Math.round((10 + stage * 10) * progressFactor)}
              scale={[8, 8, 8]}
              position={[0, trunkHeight / 2, 0]}
              size={2.5}
              speed={0.35}
              color={theme.accent}
              opacity={0.5}
            />
          </>
        )}

        {/* Fireflies near ground — only at high stage */}
        {stage >= 3 && (
          <Sparkles
            count={20}
            scale={[10, 2, 10]}
            position={[0, 1, 0]}
            size={2}
            speed={0.2}
            color="#fef08a"
            opacity={0.4}
          />
        )}
      </group>

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={20}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={[0, trunkHeight / 2, 0]}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

// ============================================================================
// Info Panel Tabs
// ============================================================================

type TabId = "overview" | "subjects" | "streak" | "milestones" | "tips";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Ringkasan", icon: <TreePine size={14} /> },
  { id: "subjects", label: "Mapel", icon: <BookOpen size={14} /> },
  { id: "streak", label: "Streak", icon: <Flame size={14} /> },
  { id: "milestones", label: "Milestone", icon: <Trophy size={14} /> },
  { id: "tips", label: "Tips", icon: <Lightbulb size={14} /> },
];

// ============================================================================
// Main Component
// ============================================================================

export function Tree3DView({
  studentName,
  level,
  levelName,
  totalXp,
  levelProgress,
  xpToNext,
  totalMastered,
  totalConcepts,
  avgMasteryPct,
  totalAttempts,
  streakCurrent,
  streakLongest,
  streakFreeze,
  subjects,
  recommendation,
  sparkTip,
  buddyType,
  buddyStage,
}: Props) {
  const stage = getStage(level);
  const stageName = STAGE_NAMES[stage - 1];
  const stageDesc = STAGE_DESCRIPTIONS[stage - 1];
  const theme = BUDDY_THEMES[buddyType] ?? BUDDY_THEMES.bunga;
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [panelOpen, setPanelOpen] = useState(true);

  const handleTabChange = useCallback(
    (tab: TabId) => {
      setActiveTab(tab);
      if (!panelOpen) setPanelOpen(true);
    },
    [panelOpen],
  );

  return (
    <div className="relative h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] w-auto -mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 -mb-24 md:-mb-8 overflow-hidden bg-gradient-to-b from-background via-muted/10 to-background rounded-none border-none">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 6, 14], fov: 40 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <TreeScene
            totalXp={totalXp}
            totalMastered={totalMastered}
            avgMasteryPct={avgMasteryPct}
            buddyType={buddyType}
            stage={stage}
          />
        </Suspense>
      </Canvas>

      {/* Header Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-3 left-3 sm:top-5 sm:left-5"
      >
        <div className="flex items-center gap-2 rounded-full bg-card/70 backdrop-blur-xl border border-border/40 px-3 py-1.5 shadow-lg">
          <span className="text-lg">
            {stage >= 3 ? "🌳" : stage >= 2 ? "🌿" : "🌱"}
          </span>
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: theme.accent }}
            >
              Pohon Kehidupan
            </p>
            <p className="text-xs font-bold text-foreground">{studentName}</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Floating Orbs - top right */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute top-3 right-3 sm:top-5 sm:right-5 flex gap-2"
      >
        {/* XP Orb */}
        <div className="flex flex-col items-center rounded-xl bg-card/70 backdrop-blur-xl border border-border/40 px-3 py-2 shadow-lg">
          <Zap size={14} className="text-amber-400 mb-0.5" />
          <p className="text-xs font-bold text-foreground">
            {totalXp.toLocaleString()}
          </p>
          <p className="text-[9px] text-muted-foreground">XP</p>
        </div>
        {/* Level Orb */}
        <div className="flex flex-col items-center rounded-xl bg-card/70 backdrop-blur-xl border border-border/40 px-3 py-2 shadow-lg">
          <Star size={14} className="mb-0.5" style={{ color: theme.accent }} />
          <p className="text-xs font-bold text-foreground">Lv.{level}</p>
          <p className="text-[9px] text-muted-foreground">{levelName}</p>
        </div>
        {/* Streak Orb */}
        {streakCurrent > 0 && (
          <div className="flex flex-col items-center rounded-xl bg-card/70 backdrop-blur-xl border border-border/40 px-3 py-2 shadow-lg">
            <Flame size={14} className="text-orange-400 mb-0.5" />
            <p className="text-xs font-bold text-foreground">{streakCurrent}</p>
            <p className="text-[9px] text-muted-foreground">hari</p>
          </div>
        )}
      </motion.div>

      {/* Toggle Panel Button (mobile) */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        type="button"
        onClick={() => setPanelOpen(!panelOpen)}
        className="absolute bottom-3 right-3 sm:hidden z-20 rounded-full bg-card/80 backdrop-blur-xl border border-border/40 p-2 shadow-lg"
      >
        <ChevronRight
          size={18}
          className={`transition-transform duration-300 ${panelOpen ? "rotate-90" : "-rotate-90"}`}
        />
      </motion.button>

      {/* Info Panel */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-auto sm:w-[410px] z-10"
          >
            <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-2xl shadow-2xl overflow-hidden">
              {/* Tab Bar */}
              <div className="flex w-full border-b border-border/30 bg-muted/30">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-[10.5px] sm:text-xs font-semibold transition-all duration-200 relative ${
                      activeTab === tab.id
                        ? "text-foreground font-bold"
                        : "text-muted-foreground hover:text-foreground/70"
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full"
                        style={{ backgroundColor: theme.accent }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-5 max-h-[280px] sm:max-h-[320px] overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                  {activeTab === "overview" && (
                    <TabOverview
                      key="overview"
                      stageName={stageName ?? ""}
                      stageDesc={stageDesc ?? ""}
                      level={level}
                      levelName={levelName}
                      levelProgress={levelProgress}
                      xpToNext={xpToNext}
                      totalXp={totalXp}
                      totalMastered={totalMastered}
                      totalConcepts={totalConcepts}
                      avgMasteryPct={avgMasteryPct}
                      totalAttempts={totalAttempts}
                      buddyType={buddyType}
                      buddyStage={buddyStage}
                      theme={theme}
                    />
                  )}
                  {activeTab === "subjects" && (
                    <TabSubjects
                      key="subjects"
                      subjects={subjects}
                      recommendation={recommendation}
                    />
                  )}
                  {activeTab === "streak" && (
                    <TabStreak
                      key="streak"
                      current={streakCurrent}
                      longest={streakLongest}
                      freeze={streakFreeze}
                    />
                  )}
                  {activeTab === "milestones" && (
                    <TabMilestones key="milestones" currentLevel={level} />
                  )}
                  {activeTab === "tips" && (
                    <TabTips
                      key="tips"
                      sparkTip={sparkTip}
                      recommendation={recommendation}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Tab: Overview
// ============================================================================

function TabOverview({
  stageName,
  stageDesc,
  level,
  levelName,
  levelProgress,
  xpToNext,
  totalXp,
  totalMastered,
  totalConcepts,
  avgMasteryPct,
  totalAttempts,
  buddyType,
  buddyStage,
  theme,
}: {
  stageName: string;
  stageDesc: string;
  level: number;
  levelName: string;
  levelProgress: number;
  xpToNext: number | null;
  totalXp: number;
  totalMastered: number;
  totalConcepts: number;
  avgMasteryPct: number;
  totalAttempts: number;
  buddyType: string;
  buddyStage: number;
  theme: { label: string; canopy: string; accent: string; glow: string };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Stage Header */}
      <div>
        <h2 className="font-heading text-lg font-bold">{stageName}</h2>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {stageDesc}
        </p>
      </div>

      {/* Level Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <p className="text-[11px] font-semibold text-muted-foreground">
            Level {level} · {levelName}
          </p>
          {xpToNext !== null && (
            <p className="text-[10px] text-muted-foreground">
              {xpToNext.toLocaleString()} XP lagi
            </p>
          )}
        </div>
        <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${theme.accent}, ${theme.glow})`,
            }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={<SparklesIcon size={13} className="text-amber-400" />}
          label="Total XP"
          value={totalXp.toLocaleString()}
        />
        <StatCard
          icon={<Target size={13} className="text-blue-400" />}
          label="Dikuasai"
          value={`${totalMastered}/${totalConcepts}`}
        />
        <StatCard
          icon={<TrendingUp size={13} className="text-emerald-400" />}
          label="Penguasaan"
          value={`${avgMasteryPct}%`}
        />
        <StatCard
          icon={<BookOpen size={13} className="text-purple-400" />}
          label="Total Latihan"
          value={totalAttempts.toLocaleString()}
        />
      </div>

      {/* Buddy Info */}
      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/20">
        <span className="text-xl">
          {buddyType === "bunga"
            ? "🌸"
            : buddyType === "kaktus"
              ? "🌵"
              : buddyType === "bonsai"
                ? "🎋"
                : "🌳"}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold">{theme.label}</p>
          <p className="text-[10px] text-muted-foreground">
            Stage {buddyStage} · Buddy belajarmu
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/15">
      {icon}
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs font-bold">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Subjects
// ============================================================================

function TabSubjects({
  subjects,
  recommendation,
}: {
  subjects: SubjectInfo[];
  recommendation: RecommendationInfo | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      {/* Recommendation Card */}
      {recommendation && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <Target size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                Rekomendasi Belajar
              </p>
              <p className="text-xs font-semibold mt-0.5">
                {recommendation.conceptName}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {recommendation.subjectName} · {recommendation.reason}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <StatusBadge status={recommendation.status} />
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(recommendation.masteryScore * 100)}% penguasaan
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subject List */}
      <div className="space-y-2">
        {subjects.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Belum ada mata pelajaran fokus. Pilih di halaman dashboard!
          </p>
        ) : (
          subjects.map((subject) => (
            <SubjectRow key={subject.name} subject={subject} />
          ))
        )}
      </div>
    </motion.div>
  );
}

function SubjectRow({ subject }: { subject: SubjectInfo }) {
  const barColor = subject.color ?? "#22c55e";

  return (
    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/15 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {subject.icon && <span className="text-sm">{subject.icon}</span>}
          <p className="text-xs font-semibold">{subject.name}</p>
        </div>
        <p className="text-[11px] font-bold" style={{ color: barColor }}>
          {subject.masteryPct}%
        </p>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${subject.masteryPct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
        />
      </div>
      {/* Concept breakdown */}
      <div className="flex gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {subject.masteredConcepts} dikuasai
        </span>
        <span className="flex items-center gap-0.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
          {subject.learningConcepts} belajar
        </span>
        <span className="flex items-center gap-0.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500" />
          {subject.strugglingConcepts} struggle
        </span>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "NOT_STARTED" | "LEARNING" | "MASTERED" | "STRUGGLING";
}) {
  const config = {
    NOT_STARTED: {
      label: "Belum mulai",
      className: "bg-zinc-500/20 text-zinc-400",
    },
    LEARNING: { label: "Belajar", className: "bg-blue-500/20 text-blue-400" },
    MASTERED: {
      label: "Dikuasai",
      className: "bg-emerald-500/20 text-emerald-400",
    },
    STRUGGLING: {
      label: "Perlu bantuan",
      className: "bg-orange-500/20 text-orange-400",
    },
  }[status];

  return (
    <span
      className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

// ============================================================================
// Tab: Streak
// ============================================================================

function TabStreak({
  current,
  longest,
  freeze,
}: {
  current: number;
  longest: number;
  freeze: number;
}) {
  const milestones = [3, 7, 14, 30, 100];
  const nextMilestone =
    milestones.find((m) => m > current) ?? milestones[milestones.length - 1];
  const prevMilestone =
    [...milestones].reverse().find((m) => m <= current) ?? 0;
  const progressToNext = nextMilestone
    ? Math.min(
        100,
        ((current - prevMilestone) / (nextMilestone - prevMilestone)) * 100,
      )
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Big Streak Display */}
      <div className="text-center py-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 mb-2">
          <div className="text-center">
            <Flame size={20} className="mx-auto text-orange-400" />
            <p className="text-lg font-bold text-foreground leading-none mt-0.5">
              {current}
            </p>
          </div>
        </div>
        <p className="text-xs font-semibold text-foreground">
          {current === 0
            ? "Mulai streak hari ini!"
            : `${current} hari berturut-turut!`}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Rekor terpanjang: {longest} hari
        </p>
      </div>

      {/* Progress to Next Milestone */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">
            Milestone berikutnya: {nextMilestone} hari
          </span>
          <span className="font-medium text-orange-400">
            {nextMilestone - current} hari lagi
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressToNext}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
          />
        </div>
      </div>

      {/* Streak Freeze */}
      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
        <Shield size={16} className="text-sky-400 shrink-0" />
        <div>
          <p className="text-[11px] font-semibold text-sky-400">
            Streak Freeze
          </p>
          <p className="text-[10px] text-muted-foreground">
            {freeze > 0
              ? `${freeze} freeze tersedia — streak kamu aman kalau skip 1 hari`
              : "Tidak ada freeze. Belajar tiap hari biar streak aman!"}
          </p>
        </div>
      </div>

      {/* Milestone List */}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Milestone
        </p>
        <div className="flex flex-wrap gap-1.5">
          {milestones.map((m) => (
            <div
              key={m}
              className={`text-[10px] px-2 py-1 rounded-lg font-medium ${
                current >= m
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "bg-muted/40 text-muted-foreground border border-border/20"
              }`}
            >
              {m === current ? "🔥 " : current >= m ? "✅ " : ""}
              {m} hari
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Tab: Milestones
// ============================================================================

function TabMilestones({ currentLevel }: { currentLevel: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      <p className="text-xs text-muted-foreground">
        Pohonmu bertransformasi setiap kali kamu mencapai milestone level baru.
      </p>

      <div className="space-y-1.5">
        {MILESTONE_LEVELS.map((m, idx) => {
          const achieved = currentLevel >= m.level;
          const isCurrent =
            currentLevel >= m.level &&
            (idx === MILESTONE_LEVELS.length - 1 ||
              currentLevel < MILESTONE_LEVELS[idx + 1].level);

          return (
            <div
              key={m.level}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 ${
                isCurrent
                  ? "bg-emerald-500/10 border-emerald-500/30 shadow-sm"
                  : achieved
                    ? "bg-muted/30 border-border/20"
                    : "bg-muted/15 border-border/10 opacity-60"
              }`}
            >
              <span className="text-lg">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-semibold ${achieved ? "" : "text-muted-foreground"}`}
                >
                  {m.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Level {m.level}
                  {isCurrent && " · Kamu di sini!"}
                </p>
              </div>
              {isCurrent && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                  Sekarang
                </span>
              )}
              {achieved && !isCurrent && (
                <span className="text-emerald-400 text-xs">✓</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Next milestone info */}
      {(() => {
        const next = MILESTONE_LEVELS.find((m) => m.level > currentLevel);
        if (!next) {
          return (
            <div className="text-center p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
              <Trophy size={20} className="mx-auto text-amber-400 mb-1" />
              <p className="text-xs font-bold text-amber-400">
                Semua milestone tercapai!
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Pohonmu sudah mencapai kebesaran maksimal. Luar biasa!
              </p>
            </div>
          );
        }
        return (
          <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
            <p className="text-[10px] text-muted-foreground">
              {next.level - currentLevel} level lagi menuju{" "}
              <span className="font-semibold text-foreground">
                {next.icon} {next.name}
              </span>
            </p>
          </div>
        );
      })()}
    </motion.div>
  );
}

// ============================================================================
// Tab: Tips
// ============================================================================

function TabTips({
  sparkTip,
  recommendation,
}: {
  sparkTip: string;
  recommendation: RecommendationInfo | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Spark Tip */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
        <div className="flex items-start gap-2">
          <Lightbulb size={16} className="text-violet-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-violet-400">
              💡 Spark Tip Hari Ini
            </p>
            <p className="text-xs text-foreground/80 mt-1 leading-relaxed">
              {sparkTip}
            </p>
          </div>
        </div>
      </div>

      {/* Study buddy tips */}
      <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
        <div className="flex items-start gap-2">
          <Flower2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] font-bold text-emerald-400">
              Tips Merawat Pohon
            </p>
            <ul className="text-[10px] text-muted-foreground mt-1 space-y-1 list-disc list-inside">
              <li>Belajar tiap hari bikin pohonmu tumbuh lebih cepat</li>
              <li>Kuasai konsep baru untuk menambah cabang</li>
              <li>Streak yang panjang bikin daun makin lebat</li>
              <li>Tingkatkan penguasaan untuk warna yang lebih cerah</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Focus recommendation */}
      {recommendation && (
        <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
          <div className="flex items-start gap-2">
            <Sprout size={14} className="text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-emerald-400">
                Fokus Belajar
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Lanjutkan belajar{" "}
                <span className="font-semibold text-foreground">
                  {recommendation.conceptName}
                </span>{" "}
                ({recommendation.subjectName}) untuk mempercepat pertumbuhan
                pohonmu.
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
