"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { useMemo } from "react";
import { motion } from "framer-motion";

type Props = {
  level: number;
  totalXp: number;
  totalMastered: number;
  totalConcepts: number;
  avgMasteryPct: number;
  buddyType: string;
};

const STAGE_THRESHOLDS = [5, 15, 30];
const STAGE_NAMES = ["Bibit", "Kecambah", "Dewasa", "Raksasa"];

const BUDDY_COLORS: Record<string, string> = {
  bunga: "#4ade80",
  kaktus: "#2dd4bf",
  bonsai: "#34d399",
  beringin: "#a3e635",
};

function getStage(level: number): number {
  if (level <= STAGE_THRESHOLDS[0]) return 1;
  if (level <= STAGE_THRESHOLDS[1]) return 2;
  if (level <= STAGE_THRESHOLDS[2]) return 3;
  return 4;
}

export function Tree3DView({
  level,
  totalXp,
  totalMastered,
  totalConcepts,
  avgMasteryPct,
  buddyType,
}: Props) {
  const stage = getStage(level);
  const stageName = STAGE_NAMES[stage - 1];
  const canopyColor = BUDDY_COLORS[buddyType] ?? "#4ade80";

  const trunkHeight = Math.min(8, 1 + totalXp / 500);
  const trunkRadius = Math.max(0.08, Math.min(0.3, 0.08 + totalXp / 50000));
  const branchCount = Math.min(totalMastered, 12);
  const leafCount = Math.round(20 + (avgMasteryPct / 100) * 60);

  return (
    <div className="relative h-[calc(100vh-2rem)] sm:h-[calc(100vh-4rem)] w-full rounded-2xl overflow-hidden border border-border/30 bg-gradient-to-b from-sky-100/20 to-emerald-100/20 dark:from-sky-950/30 dark:to-emerald-950/20">
      <Canvas camera={{ position: [0, 4, 10], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 3]} intensity={1.2} castShadow />
        <Environment preset="sunset" />

        <group>
          <mesh rotation-x={-Math.PI / 2} position-y={0} receiveShadow>
            <circleGeometry args={[6, 48]} />
            <meshStandardMaterial color="#86efac" roughness={0.9} />
          </mesh>

          <mesh position-y={trunkHeight / 2} castShadow>
            <cylinderGeometry args={[trunkRadius * 0.7, trunkRadius, trunkHeight, 12]} />
            <meshStandardMaterial color="#8B6914" roughness={0.8} />
          </mesh>

          <Branches
            count={branchCount}
            trunkHeight={trunkHeight}
            trunkRadius={trunkRadius}
          />

          <Canopy
            leafCount={leafCount}
            trunkHeight={trunkHeight}
            color={canopyColor}
            stage={stage}
          />
        </group>

        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={18}
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI / 2 - 0.1}
          target={[0, trunkHeight / 2, 0]}
        />
      </Canvas>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto"
      >
        <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl p-4 sm:p-5 shadow-lg max-w-xs">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Pohon Kehidupan
          </p>
          <h2 className="font-heading text-lg font-bold mt-1">{stageName}</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Level</p>
              <p className="font-bold">{level}</p>
            </div>
            <div>
              <p className="text-muted-foreground">XP</p>
              <p className="font-bold">{totalXp.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dikuasai</p>
              <p className="font-bold">{totalMastered}/{totalConcepts}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Penguasaan</p>
              <p className="font-bold">{avgMasteryPct}%</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Branches({
  count,
  trunkHeight,
  trunkRadius,
}: {
  count: number;
  trunkHeight: number;
  trunkRadius: number;
}) {
  const branches = useMemo(() => {
    const result: Array<{
      position: [number, number, number];
      rotation: [number, number, number];
      length: number;
    }> = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / Math.max(count, 1)) * Math.PI * 2 + i * 0.7;
      const heightFraction = 0.4 + (i % 3) * 0.15;
      const y = trunkHeight * heightFraction;
      const length = trunkHeight * 0.25 + (i * 0.02) * trunkHeight * 0.15;
      const tilt = Math.PI / 4 + (i * 0.03) * 0.3;

      result.push({
        position: [
          Math.cos(angle) * trunkRadius,
          y,
          Math.sin(angle) * trunkRadius,
        ],
        rotation: [Math.sin(angle) * tilt, 0, Math.cos(angle) * tilt],
        length,
      });
    }
    return result;
  }, [count, trunkHeight, trunkRadius]);

  return (
    <>
      {branches.map((b, i) => (
        <mesh key={i} position={b.position} rotation={b.rotation} castShadow>
          <cylinderGeometry args={[trunkRadius * 0.2, trunkRadius * 0.35, b.length, 6]} />
          <meshStandardMaterial color="#8B6914" roughness={0.8} />
        </mesh>
      ))}
    </>
  );
}

function Canopy({
  leafCount,
  trunkHeight,
  color,
  stage,
}: {
  leafCount: number;
  trunkHeight: number;
  color: string;
  stage: number;
}) {
  const leaves = useMemo(() => {
    const canopyRadius = 1 + stage * 0.5;
    const canopyY = trunkHeight + canopyRadius * 0.3;
    const rng = mulberry32(stage * 1000 + leafCount);

    return Array.from({ length: leafCount }, () => {
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      const r = canopyRadius * (0.5 + rng() * 0.5);
      const size = 0.2 + rng() * 0.25;

      return {
        position: [
          r * Math.sin(phi) * Math.cos(theta),
          canopyY + r * Math.cos(phi) * 0.6,
          r * Math.sin(phi) * Math.sin(theta),
        ] as [number, number, number],
        size,
      };
    });
  }, [leafCount, trunkHeight, stage]);

  return (
    <>
      {leaves.map((leaf, i) => (
        <mesh key={i} position={leaf.position} castShadow>
          <sphereGeometry args={[leaf.size, 8, 6]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      ))}
    </>
  );
}

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
