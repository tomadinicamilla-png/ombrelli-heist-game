import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const W = 1100;
const H = 620;
const FONT = "'Press Start 2P', monospace";
const PLAYER_IDLE_X = 980;
const PLAYER_STEAL_X = 875;
const RACK_X = 735;
const RACK_Y = 458;
const MAX_LEVEL = 5;

type RainLevel = "light" | "medium" | "heavy";
type Phase = "menu" | "playing" | "won" | "lost";
type NpcKey = "lady-dog" | "old-man" | "couple";
type WaiterSide = "left" | "right";
type FlashKind = "danger" | "warning" | "success" | null;

type UmbrellaType = {
  label: string;
  stealMs: number;
  base: string;
  accent: string;
  pattern: "plaid" | "dots" | "stripe" | "bands" | "diamond";
};

type Umbrella = UmbrellaType & {
  id: string;
  points: number;
};

type CustomerState = { kind: NpcKey; x: number } | null;
type CaughtActor =
  | null
  | { type: "waiter"; side: WaiterSide }
  | { type: "customer"; kind: NpcKey };

type PickupFxItem = { id: string; x: number; y: number };

type LeaderboardEntry = {
  score: number;
  level: number;
  time: number;
  date: string;
};

const WEATHER: Record<
  RainLevel,
  { label: string; timeMult: number; scoreMult: number; rainCount: number }
> = {
  light: { label: "LIGHT RAIN", timeMult: 1, scoreMult: 1, rainCount: 44 },
  medium: {
    label: "HEAVY RAIN",
    timeMult: 1.18,
    scoreMult: 1.15,
    rainCount: 84,
  },
  heavy: {
    label: "STORM",
    timeMult: 1.42,
    scoreMult: 1.35,
    rainCount: 128,
  },
};

const UMBRELLA_TYPES: readonly UmbrellaType[] = [
  {
    label: "Tartan",
    stealMs: 500,
    base: "#ff5c6f",
    accent: "#ffe082",
    pattern: "plaid",
  },
  {
    label: "Midnight",
    stealMs: 1000,
    base: "#4d96ff",
    accent: "#e3f2fd",
    pattern: "dots",
  },
  {
    label: "Emerald",
    stealMs: 1500,
    base: "#31d66b",
    accent: "#fff3bf",
    pattern: "stripe",
  },
  {
    label: "Brick",
    stealMs: 2200,
    base: "#ff9b54",
    accent: "#ffe08a",
    pattern: "bands",
  },
  {
    label: "Violet",
    stealMs: 3000,
    base: "#b76bff",
    accent: "#f5d0fe",
    pattern: "diamond",
  },
];

const NPCS: readonly { key: NpcKey; name: string }[] = [
  { key: "lady-dog", name: "The lady with the dog" },
  { key: "old-man", name: "The old man" },
  { key: "couple", name: "The happy couple" },
];

function pxShadow(color = "#000") {
  return { boxShadow: `4px 4px 0 ${color}` };
}

function scanlines() {
  return {
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 1px, transparent 1px, transparent 4px)",
  } as const;
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function randomWeather(): RainLevel {
  const keys: RainLevel[] = ["light", "medium", "heavy"];
  return keys[Math.floor(Math.random() * keys.length)];
}

function makeUmbrellas(level: number): Umbrella[] {
  const count = Math.min(5 + level, 12);
  return Array.from({ length: count }).map((_, index) => {
    const type = UMBRELLA_TYPES[Math.floor(Math.random() * UMBRELLA_TYPES.length)];
    return {
      id: `${level}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      ...type,
      points: Math.round(type.stealMs / 25),
    };
  });
}

function runSanityChecks() {
  const umbrellas = makeUmbrellas(1);
  console.assert(umbrellas.length === 6, "Level 1 should spawn 6 umbrellas");
  console.assert(
    WEATHER.heavy.scoreMult > WEATHER.light.scoreMult,
    "Heavy rain should reward more points"
  );
  console.assert(
    UMBRELLA_TYPES[0].stealMs === 500 && UMBRELLA_TYPES[4].stealMs === 3000,
    "Umbrella time range should stay 0.5s–3s"
  );
}

function RainLayer({ intensity }: { intensity: RainLevel }) {
  const cfg = WEATHER[intensity];
  const drops = useMemo(
    () =>
      Array.from({ length: cfg.rainCount }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        duration: rand(
          intensity === "heavy" ? 0.45 : 0.8,
          intensity === "light" ? 1.7 : 1.2
        ),
        delay: rand(0, 2),
        height: rand(12, intensity === "heavy" ? 28 : 20),
      })),
    [cfg.rainCount, intensity]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2] mix-blend-screen">
      {drops.map((drop) => (
        <motion.div
          key={drop.id}
          className="absolute rounded-full"
          style={{
            left: drop.left,
            width: intensity === "heavy" ? 3 : 2,
            height: drop.height,
            top: -30,
            transform: "skewX(-20deg)",
            background: `rgba(224,248,255,${
              intensity === "heavy"
                ? 0.82
                : intensity === "medium"
                  ? 0.6
                  : 0.42
            })`,
            boxShadow: `0 0 6px rgba(224,248,255,${
              intensity === "heavy" ? 0.6 : 0.3
            })`,
          }}
          animate={{ y: [0, H + 80] }}
          transition={{
            repeat: Infinity,
            duration: drop.duration,
            delay: drop.delay,
            ease: "linear",
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-sky-100/5" />
      {intensity !== "light" && (
        <div className="absolute inset-x-0 bottom-[86px] h-[10px] bg-white/8 blur-[2px]" />
      )}
      {intensity === "heavy" && <div className="absolute inset-0 bg-sky-100/6" />}
    </div>
  );
}

function WindowFrame({
  side,
  waiterVisible,
  curtainLift,
  dangerSide,
}: {
  side: WaiterSide;
  waiterVisible: boolean;
  curtainLift: WaiterSide | null;
  dangerSide: WaiterSide;
}) {
  const isActive = waiterVisible && side === dangerSide;
  const isPreview = curtainLift === side;

  return (
    <motion.div
      className="absolute top-[54px] w-[112px] h-[108px] rounded-[10px] border-4 border-black overflow-hidden"
      style={{
        left: side === "left" ? 220 : 364,
        background: isActive ? "#61b6ff" : "#8ed0ff",
        boxShadow: isActive
          ? "0 0 0 2px rgba(255,245,157,.65), 0 0 18px rgba(255,138,101,.45), 4px 4px 0 #000"
          : isPreview
            ? "0 0 0 2px rgba(255,245,157,.35), 0 0 12px rgba(255,255,255,.18), 4px 4px 0 #000"
            : "4px 4px 0 #000",
      }}
      animate={
        isActive
          ? { scale: [1, 1.02, 1] }
          : isPreview
            ? { scale: [1, 1.01, 1] }
            : { scale: 1 }
      }
      transition={{
        repeat: isActive || isPreview ? Infinity : 0,
        duration: isActive ? 0.42 : 1.2,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-sky-900/15" />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[18px] bg-black/10"
        animate={{ opacity: [0.15, 0.28, 0.15] }}
        transition={{ repeat: Infinity, duration: 2.4 }}
      />
    </motion.div>
  );
}

function Waiter({
  visible,
  alert,
  left,
  top,
}: {
  visible: boolean;
  alert: boolean;
  left: number;
  top: number;
}) {
  return (
    <div
      className="absolute overflow-hidden pointer-events-none"
      style={{ left, top, width: 112, height: 108 }}
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 58, opacity: 0.96, scale: 0.94 }}
            animate={{ y: 18, opacity: 1, scale: 1 }}
            exit={{ y: 58, opacity: 0.96, scale: 0.94 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 -translate-x-1/2"
          >
            <motion.div
              className="relative flex flex-col items-center"
              animate={
                alert
                  ? { y: [0, 1, 0, 1], scaleX: [1, 1.06, 1, 1.06] }
                  : { y: [0, 0.5, 0] }
              }
              transition={
                alert
                  ? { repeat: Infinity, duration: 0.24 }
                  : { repeat: Infinity, duration: 1.2 }
              }
            >
              <motion.div
                className="relative w-[50px] h-[50px] rounded-[10px] border-4 border-black bg-[#ffd3a1]"
                style={{ ...pxShadow(), filter: alert ? "saturate(1.2)" : "none" }}
                animate={alert ? { rotate: [0, -1, 1, 0] } : { rotate: 0 }}
                transition={
                  alert ? { repeat: Infinity, duration: 0.22 } : { duration: 0.2 }
                }
              >
                <div className="absolute inset-x-[4px] top-[2px] h-[11px] rounded-t-[6px] bg-[#6b3f1f] border-b-[3px] border-black" />
                <div className="absolute left-[9px] top-[17px] w-[5px] h-[5px] rounded-full bg-black" />
                <div className="absolute right-[9px] top-[17px] w-[5px] h-[5px] rounded-full bg-black" />
                <div className="absolute left-1/2 -translate-x-1/2 top-[24px] w-[6px] h-[5px] bg-[#cf8b52] rounded-full" />
                <motion.div
                  className="absolute left-[6px] top-[31px] h-[4px] rounded-full bg-[#3d1f0d]"
                  animate={
                    alert ? { width: [14, 18, 14] } : { width: [13, 14, 13] }
                  }
                  transition={{ repeat: Infinity, duration: 0.18 }}
                />
                <motion.div
                  className="absolute right-[6px] top-[31px] h-[4px] rounded-full bg-[#3d1f0d]"
                  animate={
                    alert ? { width: [14, 18, 14] } : { width: [13, 14, 13] }
                  }
                  transition={{ repeat: Infinity, duration: 0.18 }}
                />
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 top-[35px] h-[3px] rounded-full bg-black"
                  animate={
                    alert ? { width: [16, 22, 16] } : { width: [15, 17, 15] }
                  }
                  transition={{ repeat: Infinity, duration: 0.18 }}
                />
              </motion.div>

              <motion.div
                className="-mt-1 relative w-[64px] h-[36px] rounded-[8px] border-4 border-black bg-white"
                style={{
                  boxShadow: alert
                    ? "0 0 14px rgba(255,82,82,.22), 4px 4px 0 #000"
                    : "4px 4px 0 #000",
                }}
                animate={alert ? { y: [0, 2, 0] } : { y: 0 }}
                transition={
                  alert ? { repeat: Infinity, duration: 0.22 } : { duration: 0.2 }
                }
              >
                <div className="absolute inset-x-[8px] top-[8px] h-[3px] rounded-full bg-black/20" />
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[4px] bg-black/10" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Customer({
  kind,
  x,
  attention = false,
  angry = false,
}: {
  kind: NpcKey;
  x: number;
  attention?: boolean;
  angry?: boolean;
}) {
  const legA = { y: [0, -2, 1, 0] };
  const legB = { y: [1, 0, -2, 0] };
  const reactionFx = angry ? { scale: [1, 1.08, 1.02], y: [0, -2, 0] } : {};
  const attentionFx =
    attention || angry ? { rotate: [0, -1, 0, 1, 0] } : { rotate: 0 };

  if (kind === "couple") {
    return (
      <motion.div
        className="absolute bottom-[96px]"
        style={{ left: x, width: 116, height: 124 }}
        animate={{ y: [0, -1, 0], ...reactionFx }}
        transition={{ repeat: Infinity, duration: 0.45 }}
      >
        <div className="relative flex items-end gap-2 select-none">
          <motion.div
            className="relative flex flex-col items-center"
            animate={{ y: [0, -1, 0] }}
            transition={{ repeat: Infinity, duration: 0.42 }}
          >
            <motion.div
              className="relative w-12 h-12 rounded-[10px] border-4 border-black bg-[#ffd4bf]"
              style={pxShadow()}
              animate={attentionFx}
              transition={{ repeat: Infinity, duration: 0.55 }}
            >
              <div className="absolute inset-x-[6px] top-[2px] h-[10px] rounded-t-[6px] bg-[#6b4a32] border-b-[3px] border-black" />
              <div className="absolute left-[9px] top-[18px] w-[4px] h-[4px] rounded-full bg-black" />
              <div className="absolute right-[9px] top-[18px] w-[4px] h-[4px] rounded-full bg-black" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[8px] w-[14px] h-[3px] rounded-full bg-[#8b5e3c]" />
            </motion.div>
            <motion.div
              className="-mt-1 w-14 h-14 rounded-[12px] border-4 border-black bg-[#ff8fd7]"
              style={{
                ...pxShadow(),
                filter: attention || angry ? "saturate(1.1)" : "saturate(0.82)",
              }}
              animate={{ rotate: [-1, 1, -1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            />
            <div className="-mt-1 flex gap-2">
              <motion.div
                className="w-[10px] h-[18px] rounded-b-[5px] border-4 border-black bg-[#577082]"
                style={pxShadow()}
                animate={legA}
                transition={{ repeat: Infinity, duration: 0.3 }}
              />
              <motion.div
                className="w-[10px] h-[18px] rounded-b-[5px] border-4 border-black bg-[#577082]"
                style={pxShadow()}
                animate={legB}
                transition={{ repeat: Infinity, duration: 0.3 }}
              />
            </div>
          </motion.div>

          <motion.div
            className="relative flex flex-col items-center mb-[2px]"
            animate={{ y: [0, -1, 0] }}
            transition={{ repeat: Infinity, duration: 0.48, delay: 0.08 }}
          >
            <motion.div
              className="relative w-12 h-12 rounded-[10px] border-4 border-black bg-[#ffe1c7]"
              style={pxShadow()}
              animate={attentionFx}
              transition={{ repeat: Infinity, duration: 0.55, delay: 0.08 }}
            >
              <div className="absolute inset-x-[6px] top-[2px] h-[10px] rounded-t-[6px] bg-[#2f2a27] border-b-[3px] border-black" />
              <div className="absolute left-[9px] top-[18px] w-[4px] h-[4px] rounded-full bg-black" />
              <div className="absolute right-[9px] top-[18px] w-[4px] h-[4px] rounded-full bg-black" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[8px] w-[14px] h-[3px] rounded-full bg-[#8b5e3c]" />
            </motion.div>
            <motion.div
              className="-mt-1 w-14 h-14 rounded-[12px] border-4 border-black bg-[#a983ff]"
              style={{
                ...pxShadow(),
                filter: attention || angry ? "saturate(1.1)" : "saturate(0.8)",
              }}
              animate={{ rotate: [1, -1, 1] }}
              transition={{ repeat: Infinity, duration: 0.5, delay: 0.08 }}
            />
            <div className="-mt-1 flex gap-2">
              <motion.div
                className="w-[10px] h-[18px] rounded-b-[5px] border-4 border-black bg-[#577082]"
                style={pxShadow()}
                animate={legB}
                transition={{ repeat: Infinity, duration: 0.3, delay: 0.08 }}
              />
              <motion.div
                className="w-[10px] h-[18px] rounded-b-[5px] border-4 border-black bg-[#577082]"
                style={pxShadow()}
                animate={legA}
                transition={{ repeat: Infinity, duration: 0.3, delay: 0.08 }}
              />
            </div>
          </motion.div>

          <motion.div
            className="absolute right-0 top-1 text-lg text-red-500 drop-shadow-[1px_1px_0_#000]"
            animate={{ y: [0, -1, 0], scale: [1, 1.06, 1] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
          >
            ♥
          </motion.div>

          {(attention || angry) && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px]">
              {angry ? "💢" : "!"}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  if (kind === "lady-dog") {
    return (
      <motion.div
        className="absolute bottom-[96px]"
        style={{ left: x, width: 104, height: 124 }}
        animate={{ y: [0, -1, 0], ...reactionFx }}
        transition={{ repeat: Infinity, duration: 0.42 }}
      >
        <div className="relative flex items-end gap-2 select-none">
          <motion.div
            className="relative flex flex-col items-center"
            animate={{ y: [0, -1, 0] }}
            transition={{ repeat: Infinity, duration: 0.42 }}
          >
            <motion.div
              className="relative w-[50px] h-[52px] rounded-[10px] border-4 border-black bg-[#ffd7b1]"
              style={pxShadow()}
              animate={attentionFx}
              transition={{ repeat: Infinity, duration: 0.55 }}
            >
              <div className="absolute inset-x-[6px] top-[2px] h-[10px] rounded-t-[6px] bg-[#6b3f2a] border-b-[3px] border-black" />
              <div className="absolute left-[10px] top-[18px] w-[4px] h-[4px] rounded-full bg-black" />
              <div className="absolute right-[10px] top-[18px] w-[4px] h-[4px] rounded-full bg-black" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[8px] w-[14px] h-[3px] rounded-full bg-[#8b5e3c]" />
            </motion.div>
            <motion.div
              className="-mt-1 w-[58px] h-[56px] rounded-[12px] border-4 border-black bg-[#9f88ff]"
              style={{
                ...pxShadow(),
                filter: attention || angry ? "saturate(1.08)" : "saturate(0.78)",
              }}
              animate={{ rotate: [-1, 1, -1] }}
              transition={{ repeat: Infinity, duration: 0.46 }}
            />
            <div className="-mt-1 flex gap-2">
              <motion.div
                className="w-[10px] h-[18px] rounded-b-[5px] border-4 border-black bg-[#577082]"
                style={pxShadow()}
                animate={legA}
                transition={{ repeat: Infinity, duration: 0.28 }}
              />
              <motion.div
                className="w-[10px] h-[18px] rounded-b-[5px] border-4 border-black bg-[#577082]"
                style={pxShadow()}
                animate={legB}
                transition={{ repeat: Infinity, duration: 0.28 }}
              />
            </div>
          </motion.div>

          <motion.div
            className="mb-[6px] relative w-[28px] h-[24px] rounded-[8px] border-4 border-black bg-[#ece7e2]"
            style={{
              ...pxShadow(),
              filter: attention || angry ? "brightness(1.08)" : "none",
            }}
            animate={{ y: [0, -1, 0], x: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.22 }}
          >
            <motion.div
              className="absolute -top-[8px] left-[2px] w-[8px] h-[8px] bg-[#ece7e2] border-4 border-black rotate-45"
              animate={{ rotate: [45, 25, 45] }}
              transition={{ repeat: Infinity, duration: 0.18 }}
            />
            <motion.div
              className="absolute -top-[8px] right-[2px] w-[8px] h-[8px] bg-[#ece7e2] border-4 border-black rotate-45"
              animate={{ rotate: [45, 65, 45] }}
              transition={{ repeat: Infinity, duration: 0.18 }}
            />
            <motion.div
              className="absolute right-[-6px] bottom-[-2px] w-[10px] h-[4px] bg-[#ece7e2]"
              animate={{ rotate: [0, 18, 0] }}
              transition={{ repeat: Infinity, duration: 0.16 }}
            />
          </motion.div>

          {(attention || angry) && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px]">
              {angry ? "💢" : "!"}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute bottom-[96px]"
      style={{ left: x, width: 78, height: 124 }}
      animate={{ y: [0, -1, 0], ...reactionFx }}
      transition={{ repeat: Infinity, duration: 0.34 }}
    >
      <div className="relative flex flex-col items-center select-none">
        <motion.div
          className="relative w-[50px] h-[52px] rounded-[10px] border-4 border-black bg-[#f8dcc5]"
          style={pxShadow()}
          animate={attentionFx}
          transition={{ repeat: Infinity, duration: 0.42 }}
        >
          <div className="absolute inset-x-[5px] top-[2px] h-[8px] rounded-t-[6px] bg-[#cfd8dc] border-b-[3px] border-black" />
          <div className="absolute left-[10px] top-[18px] w-[4px] h-[4px] rounded-full bg-black" />
          <div className="absolute right-[10px] top-[18px] w-[4px] h-[4px] rounded-full bg-black" />
          <div className="absolute left-1/2 -translate-x-1/2 top-[28px] w-[8px] h-[5px] rounded-full bg-[#c68642]" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[8px] w-[14px] h-[3px] rounded-full bg-[#8b5e3c]" />
        </motion.div>
        <motion.div
          className="-mt-1 w-[56px] h-[54px] rounded-[12px] border-4 border-black bg-[#90a1b0]"
          style={{
            ...pxShadow(),
            filter: attention || angry ? "saturate(1.08)" : "saturate(0.74)",
          }}
          animate={{ rotate: [1, -1, 1] }}
          transition={{ repeat: Infinity, duration: 0.34 }}
        />
        <div className="-mt-1 flex gap-2">
          <motion.div
            className="w-[10px] h-[18px] rounded-b-[5px] border-4 border-black bg-[#577082]"
            style={pxShadow()}
            animate={legA}
            transition={{ repeat: Infinity, duration: 0.22 }}
          />
          <motion.div
            className="w-[10px] h-[18px] rounded-b-[5px] border-4 border-black bg-[#577082]"
            style={pxShadow()}
            animate={legB}
            transition={{ repeat: Infinity, duration: 0.22 }}
          />
        </div>
        {(attention || angry) && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px]">
            {angry ? "💢" : "!"}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function UmbrellaPattern({
  pattern,
  accent,
}: {
  pattern: UmbrellaType["pattern"];
  accent: string;
}) {
  if (pattern === "stripe") {
    return (
      <>
        <div className="absolute left-[7px] top-[8px] w-[3px] h-[28px] bg-white/90" />
        <div className="absolute left-[16px] top-[8px] w-[3px] h-[28px] bg-white/90" />
        <div className="absolute left-[25px] top-[8px] w-[3px] h-[28px] bg-white/90" />
      </>
    );
  }

  if (pattern === "dots") {
    return (
      <>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute w-[4px] h-[4px] rounded-full"
            style={{
              background: accent,
              left: 8 + (i % 2) * 11,
              top: 10 + Math.floor(i / 2) * 12,
            }}
          />
        ))}
      </>
    );
  }

  if (pattern === "bands") {
    return (
      <>
        <div className="absolute inset-x-[5px] top-[11px] h-[4px]" style={{ background: accent }} />
        <div className="absolute inset-x-[5px] top-[21px] h-[4px]" style={{ background: accent }} />
        <div className="absolute inset-x-[5px] top-[31px] h-[4px]" style={{ background: accent }} />
      </>
    );
  }

  if (pattern === "diamond") {
    return (
      <>
        <div className="absolute left-[14px] top-[10px] w-[9px] h-[9px] rotate-45" style={{ background: accent }} />
        <div className="absolute left-[9px] top-[22px] w-[9px] h-[9px] rotate-45" style={{ background: accent }} />
        <div className="absolute left-[20px] top-[22px] w-[9px] h-[9px] rotate-45" style={{ background: accent }} />
      </>
    );
  }

  return (
    <>
      <div className="absolute left-[7px] top-[11px] w-[20px] h-[3px]" style={{ background: accent }} />
      <div className="absolute left-[12px] top-[20px] w-[12px] h-[3px]" style={{ background: accent }} />
      <div className="absolute left-[7px] top-[29px] w-[20px] h-[3px]" style={{ background: accent }} />
      <div className="absolute left-[4px] top-[8px] bottom-[6px] w-[3px]" style={{ background: accent }} />
      <div className="absolute right-[4px] top-[8px] bottom-[6px] w-[3px]" style={{ background: accent }} />
    </>
  );
}

function UmbrellaSprite({
  umbrella,
  selected,
  disabled,
  onClick,
  index,
}: {
  umbrella: Umbrella;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  index: number;
}) {
  const scale = 0.9 + ((umbrella.stealMs - 500) / 2500) * 0.3;
  const glow = 0.18 + ((umbrella.stealMs - 500) / 2500) * 0.22;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group absolute ${disabled ? "cursor-not-allowed opacity-85" : "cursor-pointer"}`}
      style={{ left: 20 + index * 15, top: 8, width: 44, height: 104 }}
      title={`${umbrella.label} · ${(umbrella.stealMs / 1000).toFixed(1)}s · ${umbrella.points} pt`}
    >
      <motion.div
        whileHover={disabled ? {} : { y: -4, scale: scale * 1.04 }}
        animate={
          disabled
            ? { y: 0, rotate: 0, scale }
            : { y: [0, -2, 0], rotate: [-1, 1, -1], scale }
        }
        transition={
          disabled
            ? { duration: 0.12 }
            : { repeat: Infinity, duration: 1.7, ease: "easeInOut" }
        }
        className="absolute inset-0"
      >
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[38px] h-[78px]">
          <div
            className={`absolute left-1/2 -translate-x-1/2 top-0 w-[38px] h-[40px] border-4 border-black overflow-hidden ${selected ? "ring-4 ring-yellow-300" : ""}`}
            style={{
              background: umbrella.base,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
              clipPath:
                "polygon(6% 100%, 0% 34%, 10% 14%, 28% 2%, 50% 0%, 72% 2%, 90% 14%, 100% 34%, 94% 100%, 72% 90%, 50% 100%, 28% 90%)",
              boxShadow: `0 0 0 1px rgba(255,255,255,.18), 0 0 14px rgba(255,255,255,.08), 0 0 18px rgba(255,220,120,${glow}), 4px 4px 0 #000`,
              filter: disabled ? "saturate(0.96)" : "saturate(1.18) brightness(1.04)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-[9px] bg-white/18" />
            <UmbrellaPattern pattern={umbrella.pattern} accent={umbrella.accent} />
            <div className="absolute inset-x-0 bottom-0 h-[6px] bg-black/10" />
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0.08, 0.2, 0.08] }}
              transition={{ repeat: Infinity, duration: 1.35 }}
              style={{
                background:
                  "radial-gradient(circle at 50% 28%, rgba(255,255,255,.26), transparent 58%)",
              }}
            />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-[36px] w-[4px] h-[30px] bg-[#4a3322] border-x border-black" />
          <div className="absolute left-1/2 -translate-x-1/2 top-[64px] w-[4px] h-[8px] bg-[#4a3322]" />
          <div className="absolute left-1/2 translate-x-[1px] top-[70px] w-[10px] h-[10px] border-r-4 border-b-4 border-[#4a3322] rounded-br-full" />
        </div>
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-[2px] text-[8px] text-white bg-slate-950/95 border-2 border-black leading-none rounded-[4px]"
          style={pxShadow()}
        >
          {(umbrella.stealMs / 1000).toFixed(1)}s
        </div>
      </motion.div>
    </button>
  );
}

function PlayerBack({
  stealing,
  carrying,
  danger,
}: {
  stealing: boolean;
  carrying: boolean;
  danger: boolean;
}) {
  return (
    <motion.div
      className="absolute bottom-[96px]"
      animate={
        stealing
          ? {
              x: [PLAYER_IDLE_X, PLAYER_STEAL_X, PLAYER_STEAL_X + 4, PLAYER_STEAL_X],
              y: [0, -1, 0, -1],
            }
          : danger
            ? {
                x: PLAYER_IDLE_X,
                y: [0, -1, 0],
                rotate: [0, -0.5, 0.5, 0],
              }
            : { x: PLAYER_IDLE_X, y: 0, rotate: 0 }
      }
      transition={
        stealing
          ? { duration: 0.45, ease: "easeOut" }
          : danger
            ? { repeat: Infinity, duration: 0.24 }
            : { duration: 0.25 }
      }
    >
      <motion.div
        animate={
          stealing
            ? { y: [0, -2, 0, -1, 0], scaleY: [1, 0.97, 1.03, 1] }
            : danger
              ? { scaleX: [1, 1.02, 1] }
              : { y: 0, scaleY: 1, scaleX: 1 }
        }
        transition={
          stealing
            ? { repeat: Infinity, duration: 0.28 }
            : danger
              ? { repeat: Infinity, duration: 0.2 }
              : { duration: 0.2 }
        }
      >
        <div className="relative flex flex-col items-center">
          {carrying && (
            <motion.div
              className="absolute -left-10 top-4 -rotate-[30deg]"
              initial={{ opacity: 0, x: 8, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: [1, 1.05, 1] }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 0.26 }}
            >
              <div className="relative w-10 h-[68px]">
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-0 w-[30px] h-[36px] border-4 border-black bg-[#1a2231] rounded-t-[16px] rounded-b-[6px]"
                  style={{
                    clipPath:
                      "polygon(6% 100%, 0% 34%, 10% 14%, 28% 2%, 50% 0%, 72% 2%, 90% 14%, 100% 34%, 94% 100%, 72% 90%, 50% 100%, 28% 90%)",
                    boxShadow: "0 0 12px rgba(255,255,255,.06), 4px 4px 0 #000",
                  }}
                />
                <div className="absolute left-1/2 -translate-x-1/2 top-[33px] w-[4px] h-[18px] bg-[#5d4630]" />
                <div className="absolute left-1/2 translate-x-[2px] top-[49px] w-[10px] h-[10px] border-r-4 border-b-4 border-[#5d4630] rounded-br-full" />
              </div>
            </motion.div>
          )}

          <div
            className="relative w-[60px] h-[62px] rounded-[12px] border-4 border-black bg-[#ffd8ad]"
            style={{
              boxShadow: danger
                ? "0 0 0 2px rgba(255,245,157,.28), 0 0 14px rgba(255,255,255,.08), 4px 4px 0 #000"
                : "0 0 0 1px rgba(255,255,255,.08), 4px 4px 0 #000",
            }}
          >
            <div className="absolute inset-x-[2px] top-[2px] h-[17px] rounded-t-[8px] bg-[#101010] border-4 border-black" />
            <div className="absolute inset-x-[2px] top-[15px] h-[8px] bg-[#101010] border-x-4 border-b-4 border-black" />
            <div className="absolute left-[6px] top-[4px] w-[12px] h-[4px] bg-white/10 rounded-full" />
            <div className="absolute inset-x-[6px] top-[25px] h-[12px] bg-[#5a3e2a]" />
            <div className="absolute left-[10px] right-[10px] bottom-[6px] h-[12px] bg-[#deb089] rounded-full" />
          </div>

          <div
            className="-mt-1 relative w-[84px] h-[62px] rounded-[14px] border-4 border-black bg-[#2f7dff]"
            style={{ boxShadow: "0 0 10px rgba(59,130,246,.18), 4px 4px 0 #000" }}
          >
            <div className="absolute inset-x-[10px] top-[10px] h-[4px] bg-white/25 rounded-full" />
            <div className="absolute left-1/2 -translate-x-1/2 top-[10px] bottom-[10px] w-[4px] bg-black/12" />
          </div>

          <div className="-mt-1 flex gap-[6px]">
            <motion.div
              className="w-[14px] h-[22px] rounded-b-[5px] border-4 border-black bg-[#45627a]"
              style={pxShadow()}
              animate={stealing ? { y: [0, -1, 1, 0] } : { y: 0 }}
              transition={
                stealing ? { repeat: Infinity, duration: 0.22 } : { duration: 0.2 }
              }
            />
            <motion.div
              className="w-[14px] h-[22px] rounded-b-[5px] border-4 border-black bg-[#45627a]"
              style={pxShadow()}
              animate={stealing ? { y: [1, 0, -1, 0] } : { y: 0 }}
              transition={
                stealing ? { repeat: Infinity, duration: 0.22 } : { duration: 0.2 }
              }
            />
          </div>

          <div
            className="absolute -left-[12px] top-[64px] w-[10px] h-[18px] rounded-[4px] border-4 border-black bg-[#2f7dff]"
            style={pxShadow()}
          />
          <div
            className="absolute -right-[12px] top-[64px] w-[10px] h-[18px] rounded-[4px] border-4 border-black bg-[#2f7dff]"
            style={pxShadow()}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function HudBadge({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className={`border-4 ${
        accent ? "bg-yellow-300 text-black border-black" : "bg-slate-950/90 text-white border-black"
      } px-3 py-2 min-w-[92px] rounded-[8px]`}
      style={{ ...pxShadow(), backdropFilter: "blur(2px)" }}
    >
      <div className={`text-[8px] mb-1 ${accent ? "text-black/70" : "text-slate-300"}`}>
        {label}
      </div>
      <div className="text-sm md:text-base leading-none">{value}</div>
    </div>
  );
}

function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <div
      className="min-h-screen bg-[#5fb6ff] text-white p-3 md:p-5 flex items-center justify-center"
      style={{ fontFamily: FONT }}
    >
      <div
        className="max-w-3xl w-full rounded-[18px] border-4 border-black bg-[#79cbff] p-8 text-center text-black"
        style={{ ...pxShadow(), ...scanlines() }}
      >
        <div className="text-4xl md:text-5xl text-red-600 mb-4">OMBRELLI HEIST</div>
        <p className="text-[11px] md:text-[12px] leading-6 text-slate-950 max-w-2xl mx-auto">
          Steal all the umbrellas from the rack without getting caught.
Waiters and customers can spot you while stealing.
The worse the weather, the higher the risk and the reward.
        </p>

        <div className="mt-6 grid md:grid-cols-3 gap-3 text-left">
          <div className="rounded-[10px] border-4 border-black bg-white p-4" style={pxShadow()}>
            <div className="text-[8px] text-slate-500 mb-1">MISSION</div>
            <div className="text-sm leading-5">Clear the umbrella rack. Beat the clock.</div>
          </div>
          <div className="rounded-[10px] border-4 border-black bg-white p-4" style={pxShadow()}>
            <div className="text-[8px] text-slate-500 mb-1">BEWARE</div>
            <div className="text-sm leading-5">Waiters and customers can catch you while stealing.</div>
          </div>
          <div className="rounded-[10px] border-4 border-black bg-white p-4" style={pxShadow()}>
            <div className="text-[8px] text-slate-500 mb-1">WEATHER</div>
            <div className="text-sm leading-5">Heavy rain increases both risk and score.</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="mt-8 px-6 py-3 bg-yellow-300 text-black border-4 border-black rounded-[10px] text-sm"
          style={pxShadow()}
        >
          START GAME
        </button>
      </div>
    </div>
  );
}

function PickupFx({ fx }: { fx: PickupFxItem[] }) {
  return (
    <AnimatePresence>
      {fx.map((item) => (
        <motion.div
          key={item.id}
          className="absolute pointer-events-none z-[12]"
          initial={{ opacity: 1, y: 0, scale: 0.8 }}
          animate={{ opacity: 0, y: -26, scale: 1.2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ left: item.x, top: item.y }}
        >
          <div
            className="px-2 py-1 rounded-[6px] border-4 border-black bg-yellow-300 text-black text-[8px]"
            style={pxShadow()}
          >
            +1
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

export default function OmbrelliHeistGame() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicIntervalRef = useRef<number | null>(null);
  const musicStepRef = useRef(0);

  function playBeep(
    freq = 440,
    duration = 0.06,
    type: OscillatorType = "square",
    gain = 0.05
  ) {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;

      if (!AudioCtx) return;

      const ctx = audioCtxRef.current || new AudioCtx();
      audioCtxRef.current = ctx;

      if (ctx.state === "suspended") {
        void ctx.resume();
      }

      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      amp.gain.setValueAtTime(gain, ctx.currentTime);
      amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // ignore audio errors
    }
  }

  function playClick() {
    playBeep(720, 0.05, "square", 0.04);
  }

  function playAlert() {
    playBeep(180, 0.12, "sawtooth", 0.06);
    window.setTimeout(() => playBeep(140, 0.12, "sawtooth", 0.05), 70);
  }

  function playSuccess() {
    playBeep(520, 0.05, "square", 0.04);
    window.setTimeout(() => playBeep(720, 0.07, "square", 0.04), 60);
  }

  function playToneAtTime(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType = "square",
    gain = 0.025
  ) {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    amp.gain.setValueAtTime(0.0001, startTime);
    amp.gain.exponentialRampToValueAtTime(gain, startTime + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(amp);
    amp.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  function startArcadeMusic() {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;

      if (!AudioCtx) return;

      const ctx = audioCtxRef.current || new AudioCtx();
      audioCtxRef.current = ctx;

      if (ctx.state === "suspended") {
        void ctx.resume();
      }

      const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 783.99, 698.46];
      const bass = [261.63, 261.63, 293.66, 293.66, 329.63, 329.63, 293.66, 293.66];

      if (musicIntervalRef.current) {
        window.clearInterval(musicIntervalRef.current);
      }

      musicStepRef.current = 0;

      musicIntervalRef.current = window.setInterval(() => {
        if (phaseRef.current !== "playing") return;

        const step = musicStepRef.current % melody.length;
        const now = ctx.currentTime + 0.01;

        playToneAtTime(ctx, melody[step], now, 0.16, "square", 0.018);
        playToneAtTime(ctx, bass[step], now, 0.22, "triangle", 0.012);

        musicStepRef.current += 1;
      }, 220);
    } catch {
      // ignore audio errors
    }
  }

  function stopArcadeMusic() {
    if (musicIntervalRef.current) {
      window.clearInterval(musicIntervalRef.current);
      musicIntervalRef.current = null;
    }
  }

  const [started, setStarted] = useState(false);
  const [level, setLevel] = useState(1);
  const [umbrellas, setUmbrellas] = useState<Umbrella[]>(() => makeUmbrellas(1));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stealing, setStealing] = useState(false);
  const [stealProgress, setStealProgress] = useState(0);
  const [waiterVisible, setWaiterVisible] = useState(false);
  const [waiterSide, setWaiterSide] = useState<WaiterSide>("right");
  const [curtainLift, setCurtainLift] = useState<WaiterSide | null>(null);
  const [customer, setCustomer] = useState<CustomerState>(null);
  const [phase, setPhase] = useState<Phase>("menu");
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState("Eyes sharp. Hands quick.");
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [currentUmbrella, setCurrentUmbrella] = useState<Umbrella | null>(null);
  const [weather, setWeather] = useState<RainLevel>("medium");
  const [pickupFx, setPickupFx] = useState<PickupFxItem[]>([]);
  const [screenFlash, setScreenFlash] = useState<FlashKind>(null);
  const [caughtActor, setCaughtActor] = useState<CaughtActor>(null);
  const [lightning, setLightning] = useState(false);
  const [nearMiss, setNearMiss] = useState(false);
  const [paused, setPaused] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const timerRef = useRef<number | null>(null);
  const waiterCycleRef = useRef<number | null>(null);
  const waiterVisibleTimeoutRef = useRef<number | null>(null);
  const waiterCheckIntervalRef = useRef<number | null>(null);
  const curtainPreviewTimeoutRef = useRef<number | null>(null);
  const customerCycleRef = useRef<number | null>(null);
  const stealIntervalRef = useRef<number | null>(null);
  const activeStealRef = useRef(false);
  const customerMoveRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>(phase);
  const nearMissTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("ombrelli-heist-leaderboard");
      if (!raw) return;
      const parsed = JSON.parse(raw) as LeaderboardEntry[];
      if (Array.isArray(parsed)) {
        setLeaderboard(parsed);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      runSanityChecks();
    }
  }, []);

  const remaining = umbrellas.length;
  const customerAttention = !!customer && stealing && customer.x > 280 && customer.x < 700;
  const dangerNow =
    !paused && stealing && (waiterVisible || customerAttention || !!caughtActor || nearMiss);

  const difficulty = useMemo(
    () => ({
      waiterMin: Math.max(3000, 6200 - level * 260),
      waiterMax: Math.max(4600, 9000 - level * 340),
      waiterVisibleMs: Math.min(1250 + level * 35, 1800),
      customerGapMin: Math.max(3800, 7600 - level * 420),
      customerGapMax: Math.max(5600, 10800 - level * 520),
      customerDuration: Math.max(3400, 7200 - level * 260),
    }),
    [level]
  );

  function clearAllTimers() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (waiterCycleRef.current) window.clearTimeout(waiterCycleRef.current);
    if (waiterVisibleTimeoutRef.current) window.clearTimeout(waiterVisibleTimeoutRef.current);
    if (waiterCheckIntervalRef.current) window.clearInterval(waiterCheckIntervalRef.current);
    if (curtainPreviewTimeoutRef.current) window.clearTimeout(curtainPreviewTimeoutRef.current);
    if (customerCycleRef.current) window.clearTimeout(customerCycleRef.current);
    if (stealIntervalRef.current) window.clearInterval(stealIntervalRef.current);
    if (customerMoveRef.current) window.clearInterval(customerMoveRef.current);
    if (nearMissTimeoutRef.current) window.clearTimeout(nearMissTimeoutRef.current);
    if (musicIntervalRef.current) window.clearInterval(musicIntervalRef.current);

    timerRef.current = null;
    waiterCycleRef.current = null;
    waiterVisibleTimeoutRef.current = null;
    waiterCheckIntervalRef.current = null;
    curtainPreviewTimeoutRef.current = null;
    customerCycleRef.current = null;
    stealIntervalRef.current = null;
    customerMoveRef.current = null;
    nearMissTimeoutRef.current = null;
    musicIntervalRef.current = null;
  }

  useEffect(() => {
    return () => {
      clearAllTimers();
      stopArcadeMusic();
      document.body.style.transform = "scale(1)";
      document.body.style.transition = "";
    };
  }, []);

  function triggerFlash(kind: FlashKind) {
    if (!kind) return;
    setScreenFlash(kind);
    window.setTimeout(() => {
      setScreenFlash((value) => (value === kind ? null : value));
    }, kind === "success" ? 180 : 140);
  }

  function triggerNearMiss() {
    setNearMiss(true);
    triggerFlash("warning");
    document.body.style.transform = "scale(0.995)";
    document.body.style.transition = "transform 0.08s";

    if (nearMissTimeoutRef.current) {
      window.clearTimeout(nearMissTimeoutRef.current);
    }

    nearMissTimeoutRef.current = window.setTimeout(() => {
      document.body.style.transform = "scale(1)";
      setNearMiss(false);
    }, 120);
  }

  function spawnPickupFx() {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setPickupFx((prev) => [...prev, { id, x: RACK_X + rand(-24, 24), y: RACK_Y + rand(-20, 18) }]);

    window.setTimeout(() => {
      setPickupFx((prev) => prev.filter((item) => item.id !== id));
    }, 420);
  }

  function resetRun() {
    clearAllTimers();
    stopArcadeMusic();
    setLevel(1);
    setUmbrellas(makeUmbrellas(1));
    setSelectedId(null);
    setStealing(false);
    setStealProgress(0);
    setWaiterVisible(false);
    setWaiterSide("right");
    setCurtainLift(null);
    setCustomer(null);
    setElapsed(0);
    setCombo(0);
    setScore(0);
    setCurrentUmbrella(null);
    setWeather(randomWeather());
    setPickupFx([]);
    setScreenFlash(null);
    setCaughtActor(null);
    setLightning(false);
    setNearMiss(false);
    setPaused(false);
    setMessage("Eyes sharp. Hands quick.");
    activeStealRef.current = false;
    document.body.style.transform = "scale(1)";
    document.body.style.transition = "";
  }

  function startGame() {
    resetRun();
    setStarted(true);
    setPhase("playing");
    window.setTimeout(() => {
      startArcadeMusic();
    }, 80);
  }

  function pauseGame() {
    if (phase !== "playing" || paused) return;
    clearAllTimers();
    stopArcadeMusic();
    activeStealRef.current = false;
    setPaused(true);
  }

  function resumeGame() {
    if (phase !== "playing" || !paused) return;
    setPaused(false);
    window.setTimeout(() => {
      startArcadeMusic();
    }, 60);
  }

  useEffect(() => {
    if (phase !== "playing" || paused) return;

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      setElapsed((t) => +(t + 0.1).toFixed(1));
    }, 100);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, paused]);

  useEffect(() => {
    if (phase !== "playing" || paused || weather !== "heavy") {
      setLightning(false);
      return;
    }

    const interval = window.setInterval(() => {
      if (Math.random() < 0.12) {
        setLightning(true);
        window.setTimeout(() => setLightning(false), 120);
      }
    }, 1800);

    return () => {
      window.clearInterval(interval);
      setLightning(false);
    };
  }, [phase, paused, weather]);

  useEffect(() => {
    if (!stealing || caughtActor || phase !== "playing" || paused) return;
    if (waiterVisible || customerAttention) {
      triggerNearMiss();
    }
  }, [stealing, waiterVisible, customerAttention, caughtActor, phase, paused]);

  function saveScoreToLeaderboard(finalScore: number, finalLevel: number, finalTime: number) {
    try {
      const nextEntry: LeaderboardEntry = {
        score: finalScore,
        level: finalLevel,
        time: finalTime,
        date: new Date().toLocaleDateString("it-IT"),
      };

      const nextBoard = [...leaderboard, nextEntry]
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (b.level !== a.level) return b.level - a.level;
          return a.time - b.time;
        })
        .slice(0, 5);

      setLeaderboard(nextBoard);
      window.localStorage.setItem(
        "ombrelli-heist-leaderboard",
        JSON.stringify(nextBoard)
      );
    } catch {
      // ignore storage errors
    }
  }

  function endGame(win: boolean, why: string) {
    clearAllTimers();
    stopArcadeMusic();
    setPhase(win ? "won" : "lost");
    setStealing(false);
    setStealProgress(0);
    setCurrentUmbrella(null);
    setWaiterVisible(false);
    setCurtainLift(null);
    setCustomer(null);
    setCaughtActor(null);
    setNearMiss(false);
    setPaused(false);
    activeStealRef.current = false;
    document.body.style.transform = "scale(1)";
    triggerFlash(win ? "success" : "danger");
    saveScoreToLeaderboard(score, level, elapsed);
    setMessage(why);
  }

  function triggerCaught(actor: Exclude<CaughtActor, null>, why: string) {
    clearAllTimers();
    stopArcadeMusic();
    activeStealRef.current = false;
    setStealing(false);
    setStealProgress(0);
    setCurrentUmbrella(null);
    setCaughtActor(actor);
    setNearMiss(false);
    setPaused(false);
    triggerFlash("warning");
    window.setTimeout(() => endGame(false, why), 700);
  }

  function scheduleWaiter() {
    if (waiterCycleRef.current) window.clearTimeout(waiterCycleRef.current);
    if (waiterVisibleTimeoutRef.current) {
      window.clearTimeout(waiterVisibleTimeoutRef.current);
    }
    if (waiterCheckIntervalRef.current) {
      window.clearInterval(waiterCheckIntervalRef.current);
    }
    if (curtainPreviewTimeoutRef.current) {
      window.clearTimeout(curtainPreviewTimeoutRef.current);
    }

    waiterCycleRef.current = window.setTimeout(() => {
      const side: WaiterSide = Math.random() > 0.5 ? "left" : "right";
      setWaiterSide(side);
      setCurtainLift(side);

      curtainPreviewTimeoutRef.current = window.setTimeout(() => {
        setCurtainLift(null);
        setWaiterVisible(true);
        playAlert();
        triggerFlash("warning");

        if (activeStealRef.current) {
          triggerCaught(
            { type: "waiter", side },
            "Spotted! The mustached waiter saw you."
          );
          return;
        }

        waiterCheckIntervalRef.current = window.setInterval(() => {
          if (activeStealRef.current) {
            if (waiterCheckIntervalRef.current) {
              window.clearInterval(waiterCheckIntervalRef.current);
              waiterCheckIntervalRef.current = null;
            }
            triggerCaught(
              { type: "waiter", side },
              "Spotted! The mustached waiter saw you."
            );
          }
        }, 50);

        waiterVisibleTimeoutRef.current = window.setTimeout(() => {
          if (waiterCheckIntervalRef.current) {
            window.clearInterval(waiterCheckIntervalRef.current);
            waiterCheckIntervalRef.current = null;
          }
          setWaiterVisible(false);
          if (phaseRef.current === "playing") {
            scheduleWaiter();
          }
        }, difficulty.waiterVisibleMs);
      }, 120);
    }, rand(difficulty.waiterMin, difficulty.waiterMax));
  }

  function scheduleCustomer() {
    if (customerCycleRef.current) {
      window.clearTimeout(customerCycleRef.current);
    }

    customerCycleRef.current = window.setTimeout(() => {
      spawnCustomer();
      if (phaseRef.current === "playing") {
        scheduleCustomer();
      }
    }, rand(difficulty.customerGapMin, difficulty.customerGapMax));
  }

  function spawnCustomer() {
    const npc = NPCS[Math.floor(Math.random() * NPCS.length)];
    const startX = -120;
    const endX = W + 40;
    const duration = difficulty.customerDuration;
    const startedAt = performance.now();

    setCustomer({ kind: npc.key, x: startX });

    if (customerMoveRef.current) {
      window.clearInterval(customerMoveRef.current);
    }

    customerMoveRef.current = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - startedAt) / duration);
      const nextX = startX + (endX - startX) * progress;
      setCustomer({ kind: npc.key, x: nextX });

      const seesZone = nextX > 350 && nextX < 650;
      if (activeStealRef.current && seesZone) {
        if (customerMoveRef.current) {
          window.clearInterval(customerMoveRef.current);
          customerMoveRef.current = null;
        }
        triggerCaught(
          { type: "customer", kind: npc.key },
          `${npc.name} spotted you stealing an umbrella.`
        );
        return;
      }

      if (progress >= 1) {
        if (customerMoveRef.current) {
          window.clearInterval(customerMoveRef.current);
          customerMoveRef.current = null;
        }
        setCustomer(null);
      }
    }, 40);
  }

  function startSteal(umbrella: Umbrella) {
    if (phase !== "playing" || stealing || paused) return;

    playClick();
    const effectiveMs = umbrella.stealMs * WEATHER[weather].timeMult;

    setSelectedId(umbrella.id);
    setStealing(true);
    setStealProgress(0);
    setCurrentUmbrella(umbrella);
    activeStealRef.current = true;
    setMessage(
  `You're stealing: ${umbrella.label}. ${
    Math.round((effectiveMs / 1000) * 10) / 10
  }s in ${WEATHER[weather].label.toLowerCase()}, ${umbrella.points} points.`
);

    const startedAt = performance.now();

    if (stealIntervalRef.current) {
      window.clearInterval(stealIntervalRef.current);
    }

    stealIntervalRef.current = window.setInterval(() => {
      const progress = Math.min(
        100,
        ((performance.now() - startedAt) / effectiveMs) * 100
      );
      setStealProgress(progress);

      if (progress >= 100) {
        if (stealIntervalRef.current) {
          window.clearInterval(stealIntervalRef.current);
          stealIntervalRef.current = null;
        }

        activeStealRef.current = false;
        setStealing(false);
        setStealProgress(0);
        setCurrentUmbrella(null);
        setUmbrellas((prev) => prev.filter((item) => item.id !== umbrella.id));
        setCombo((current) => current + 1);

        const baseGained = umbrella.points + level * 20 + Math.max(combo, 0) * 15;
        const gained = Math.round(baseGained * WEATHER[weather].scoreMult);

        setScore((current) => current + gained);
        setMessage(
          `Stolen umbrella. +${gained} points. Bonus weather: x${WEATHER[weather].scoreMult.toFixed(
            2
          )}.`
        );
        playSuccess();
        triggerFlash("success");
        spawnPickupFx();
        setSelectedId(null);
      }
    }, 40);
  }

  useEffect(() => {
    if (phase !== "playing" || paused) return;

    scheduleWaiter();
    scheduleCustomer();

    return () => {
      if (waiterCycleRef.current) {
        window.clearTimeout(waiterCycleRef.current);
        waiterCycleRef.current = null;
      }
      if (waiterVisibleTimeoutRef.current) {
        window.clearTimeout(waiterVisibleTimeoutRef.current);
        waiterVisibleTimeoutRef.current = null;
      }
      if (waiterCheckIntervalRef.current) {
        window.clearInterval(waiterCheckIntervalRef.current);
        waiterCheckIntervalRef.current = null;
      }
      if (curtainPreviewTimeoutRef.current) {
        window.clearTimeout(curtainPreviewTimeoutRef.current);
        curtainPreviewTimeoutRef.current = null;
      }
      if (customerCycleRef.current) {
        window.clearTimeout(customerCycleRef.current);
        customerCycleRef.current = null;
      }
      if (customerMoveRef.current) {
        window.clearInterval(customerMoveRef.current);
        customerMoveRef.current = null;
      }
    };
  }, [phase, paused, level, difficulty]);

  useEffect(() => {
    if (phase !== "playing" || paused) return;
    if (umbrellas.length > 0) return;

    if (level >= MAX_LEVEL) {
      endGame(
        true,
        "Rack cleared. You vanished into the rain like a legend."
      );
      return;
    }

    const nextLevel = level + 1;
    setLevel(nextLevel);
    setWeather(randomWeather());
    setUmbrellas(makeUmbrellas(nextLevel));
    setCustomer(null);
    setWaiterVisible(false);
    setCurtainLift(null);
    setSelectedId(null);
    setStealing(false);
    setStealProgress(0);
    setCurrentUmbrella(null);
    setCaughtActor(null);
    setNearMiss(false);
    activeStealRef.current = false;
    setMessage(`Level ${nextLevel}. They're getting more suspicious.`);
  }, [umbrellas, level, phase, paused]);

  if (!started || phase === "menu") {
    return <TitleScreen onStart={startGame} />;
  }

  return (
    <motion.div
      className="min-h-screen bg-[#5fb6ff] text-white p-3 md:p-5"
      style={{ fontFamily: FONT }}
      animate={screenFlash === "danger" ? { x: [0, -5, 5, -3, 0] } : { x: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div
  className="mx-auto w-fit border-4 border-black bg-[#79cbff] overflow-hidden rounded-[18px]"
  style={{ ...pxShadow(), ...scanlines() }}
>
        <div className="relative w-full overflow-hidden" style={{ width: W, height: H }}>
          <div
            className={`absolute inset-0 bg-gradient-to-b ${
              weather === "light"
                ? "from-slate-700 via-slate-600 to-slate-500"
                : weather === "medium"
                  ? "from-slate-800 via-slate-700 to-slate-600"
                  : "from-slate-950 via-slate-900 to-slate-800"
            }`}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.10),transparent_36%)]" />
          <RainLayer intensity={weather} />

          <AnimatePresence>
            {lightning && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-[3]"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.75, 0.18, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                style={{ background: "rgba(255,255,255,0.8)" }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {screenFlash && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-30"
                initial={{ opacity: 0 }}
                animate={{
                  opacity:
                    screenFlash === "success" ? [0, 0.16, 0] : [0, 0.22, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: screenFlash === "success" ? 0.18 : 0.14,
                }}
                style={{
                  background:
                    screenFlash === "success"
                      ? "rgba(255,245,157,.45)"
                      : "rgba(248,113,113,.36)",
                }}
              />
            )}
          </AnimatePresence>

          <div className="absolute inset-x-0 bottom-0 h-44 bg-[#5ecb61] border-t-4 border-black" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-[#43b14b]" />
          <div className="absolute inset-x-0 bottom-[92px] h-1 bg-black/20" />

          <div
  className="absolute left-1/2 -translate-x-[58%] bottom-[88px] w-[620px] h-[340px] rounded-[20px] border-4 border-black overflow-visible"
  style={{
    ...pxShadow(),
    backgroundColor: "#b85b35",
    backgroundImage: `
      linear-gradient(rgba(0,0,0,0.14) 2px, transparent 2px),
      linear-gradient(90deg, rgba(0,0,0,0.12) 2px, transparent 2px),
      linear-gradient(#c96d46, #a84d2a)
    `,
    backgroundSize: "26px 14px, 52px 28px, 100% 100%",
  }}
>
  {/* tetto */}
  <div
    className="absolute -top-[22px] left-[-10px] right-[-10px] h-[86px] rounded-t-[20px] border-4 border-black"
    style={{
      ...pxShadow(),
      backgroundColor: "#7c3f24",
      backgroundImage: `
        repeating-linear-gradient(
          90deg,
          #8d4a2a 0px,
          #8d4a2a 22px,
          #6f361d 22px,
          #6f361d 24px
        ),
        repeating-linear-gradient(
          0deg,
          rgba(255,255,255,0.08) 0px,
          rgba(255,255,255,0.08) 2px,
          transparent 2px,
          transparent 20px
        )
      `,
    }}
  />

  {/* insegna */}
  <div
    className="absolute top-[8px] left-1/2 -translate-x-1/2 z-20 px-8 py-2 border-4 border-black bg-yellow-300 text-black text-[26px] tracking-[0.18em]"
    style={pxShadow()}
  >
    OSTERIA
  </div>

  {/* luci alte */}
  {[
    "left-[72px]",
    "left-[152px]",
    "left-[232px]",
    "left-[388px]",
    "left-[468px]",
    "left-[548px]",
  ].map((pos, i) => (
    <div
      key={i}
      className={`absolute top-[58px] ${pos} w-[12px] h-[12px] rounded-full border-2 border-black bg-yellow-200 z-10`}
      style={{ boxShadow: "0 0 10px rgba(255,240,140,.9)" }}
    />
  ))}

  {/* finestra sinistra */}
  <div
    className="absolute top-[118px] left-[86px] w-[132px] h-[118px] rounded-[12px] border-4 border-black bg-[#79b9e8]"
    style={{
      ...pxShadow(),
      backgroundImage:
        "linear-gradient(to bottom, rgba(255,255,255,.30), transparent 35%, rgba(0,0,0,.08))",
    }}
  >
    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[4px] bg-black" />
  </div>

  {/* finestra destra */}
  <div
    className="absolute top-[118px] right-[86px] w-[132px] h-[118px] rounded-[12px] border-4 border-black bg-[#79b9e8]"
    style={{
      ...pxShadow(),
      backgroundImage:
        "linear-gradient(to bottom, rgba(255,255,255,.30), transparent 35%, rgba(0,0,0,.08))",
    }}
  >
    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[4px] bg-black" />
  </div>

  {/* tende sopra finestra sinistra */}
  <div
    className="absolute top-[88px] left-[76px] flex border-4 border-black rounded-b-[10px] overflow-hidden z-10"
    style={pxShadow()}
  >
    {["bg-red-500", "bg-white", "bg-red-500", "bg-white", "bg-red-500", "bg-white"].map(
      (c, i) => (
        <div key={i} className={`w-[24px] h-[34px] ${c} rounded-b-full`} />
      )
    )}
  </div>

  {/* tende sopra finestra destra */}
  <div
    className="absolute top-[88px] right-[76px] flex border-4 border-black rounded-b-[10px] overflow-hidden z-10"
    style={pxShadow()}
  >
    {["bg-red-500", "bg-white", "bg-red-500", "bg-white", "bg-red-500", "bg-white"].map(
      (c, i) => (
        <div key={i} className={`w-[24px] h-[34px] ${c} rounded-b-full`} />
      )
    )}
  </div>

  {/* porta centrata */}
  <div
    className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[116px] h-[176px] rounded-t-[14px] border-4 border-black bg-[#c89458]"
    style={pxShadow()}
  >
    <div className="absolute inset-x-[10px] top-[12px] bottom-[14px] border-4 border-black/15 rounded-t-[8px]" />
    <div className="absolute right-[14px] top-1/2 -translate-y-1/2 w-[12px] h-[12px] rounded-full border-2 border-black bg-yellow-300" />
  </div>

  {/* luci ai lati porta */}
  <div
    className="absolute left-[238px] top-[158px] w-[12px] h-[34px] border-2 border-black bg-yellow-200 rounded-full z-10"
    style={{ boxShadow: "0 0 10px rgba(255,240,140,.85)" }}
  />
  <div
    className="absolute right-[238px] top-[158px] w-[12px] h-[34px] border-2 border-black bg-yellow-200 rounded-full z-10"
    style={{ boxShadow: "0 0 10px rgba(255,240,140,.85)" }}
  />

  {/* zoccolo */}
  <div className="absolute inset-x-0 bottom-0 h-[16px] bg-[#7a3a20] border-t-4 border-black" />


  <Waiter
  visible={
    (waiterVisible && waiterSide === "left") ||
    (caughtActor?.type === "waiter" && caughtActor.side === "left")
  }
  alert={
    (waiterVisible && stealing) ||
    (caughtActor?.type === "waiter" && caughtActor.side === "left")
  }
  left={96}
  top={132}
/>

<Waiter
  visible={
    (waiterVisible && waiterSide === "right") ||
    (caughtActor?.type === "waiter" && caughtActor.side === "right")
  }
  alert={
    (waiterVisible && stealing) ||
    (caughtActor?.type === "waiter" && caughtActor.side === "right")
  }
  left={402}
  top={132}
/>
</div>

          <div
            className="absolute left-[470px] bottom-[94px] w-[206px] h-[120px] rounded-[16px] border-4 border-black bg-[#c0c7d1]"
            style={pxShadow()}
          >
            <div
              className="absolute inset-x-2 top-2 h-[12px] rounded-[6px] border-[3px] border-black bg-[#8d95a3]"
              style={pxShadow()}
            />
            <div className="absolute inset-x-0 top-[18px] h-[6px] bg-black/10" />
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-[12px]"
              animate={{ opacity: [0.08, 0.16, 0.08] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
              style={{
                background:
                  "radial-gradient(circle at 50% 40%, rgba(255,255,255,.14), transparent 52%)",
              }}
            />
            {umbrellas.map((umbrella, index) => (
              <UmbrellaSprite
                key={umbrella.id}
                umbrella={umbrella}
                selected={selectedId === umbrella.id}
                disabled={stealing || phase !== "playing" || paused}
                onClick={() => startSteal(umbrella)}
                index={index}
              />
            ))}
          </div>

          <PickupFx fx={pickupFx} />

          <PlayerBack stealing={stealing} carrying={stealing} danger={dangerNow} />

          {customer && (
            <Customer
              kind={customer.kind}
              x={customer.x}
              attention={customerAttention}
              angry={
                caughtActor?.type === "customer" &&
                caughtActor.kind === customer.kind
              }
            />
          )}

          <div className="absolute top-3 left-3 right-3 z-20 relative">
            <div className="flex items-start gap-2">
              <HudBadge label="LEVEL" value={`${level}/${MAX_LEVEL}`} />
              <HudBadge label="TIME" value={`${elapsed.toFixed(1)}s`} />
              <HudBadge label="COMBO" value={`x${combo}`} />
              <HudBadge label="SCORE" value={score} accent />

              <button
                type="button"
                onClick={paused ? resumeGame : pauseGame}
                className="border-4 border-black bg-red-500 hover:bg-red-400 text-white px-3 py-2 min-w-[92px] rounded-[8px] transition"
                style={{ ...pxShadow(), backdropFilter: "blur(2px)" }}
              >
                <div className="text-[8px] mb-1 text-white/80">CTRL</div>
                <div className="text-sm md:text-base leading-none">
                  {paused ? "PLAY" : "PAUSE"}
                </div>
              </button>
            </div>

            <div
  className="absolute top-0 right-0 border-4 border-black bg-slate-950/90 text-white px-3 py-2 w-[190px] rounded-[8px]"
  style={{ ...pxShadow(), backdropFilter: "blur(2px)" }}
>
  <div className="text-[8px] mb-1 text-slate-300">OBJECTIVE</div>
    <div className="text-sm md:text-base leading-none">UMBRELLAS: {remaining}</div>
    <div className="mt-2 text-[8px] text-slate-300">DON'T GET CAUGHT</div>
  </div>
</div>

          <div className="absolute top-[92px] left-3 w-[72%] z-20">
            <div
              className="border-4 border-black bg-slate-950/90 px-3 py-2 rounded-[10px] text-white"
              style={{ ...pxShadow(), backdropFilter: "blur(2px)" }}
            >
              <div className="text-[8px] text-slate-300 mb-1">STATUS</div>

              <div className="text-[10px] leading-5 text-white break-words min-h-[34px]">
                {paused ? "Paused" : message}
              </div>

              <div className="mt-2 text-[8px] text-slate-300 leading-4">
                {currentUmbrella
                  ? `${Math.round((currentUmbrella.stealMs * WEATHER[weather].timeMult) / 100) / 10}s • ${Math.round(currentUmbrella.points * WEATHER[weather].scoreMult)} pt • ${WEATHER[weather].label}`
                  : `${WEATHER[weather].label} • x${WEATHER[weather].scoreMult.toFixed(2)}`}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[8px] mb-1 text-white">
                  <span>STEAL PROGRESS</span>
                  <span>{Math.round(clamp(stealProgress, 0, 100))}%</span>
                </div>

                <div
                  className="h-4 w-full rounded-[8px] border-4 border-black bg-slate-700 overflow-hidden"
                  style={pxShadow()}
                >
                  <motion.div
                    className="h-full bg-green-400"
                    animate={{ width: `${clamp(stealProgress, 0, 100)}%` }}
                    transition={{ duration: 0.08 }}
                    style={{ boxShadow: "0 0 10px rgba(74,222,128,.35)" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="absolute right-4 bottom-4 z-20">
            <button
              type="button"
              onClick={startGame}
              className="h-12 px-4 bg-yellow-300 hover:bg-yellow-200 text-black border-4 border-black rounded-[10px] text-sm transition"
              style={pxShadow()}
            >
              RESTART
            </button>
          </div>

          <AnimatePresence>
            {paused && phase === "playing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/45 flex items-center justify-center z-40"
              >
                <div
                  className="rounded-[18px] border-4 border-black bg-[#6fc2ff] px-8 py-6 text-center text-black"
                  style={pxShadow()}
                >
                  <div className="text-2xl md:text-3xl text-red-600">PAUSED</div>
                  <p className="mt-3 text-[10px] leading-5 text-slate-950">
                    The heist is still. No one sees you. No one moves.
                  </p>
                  <button
                    type="button"
                    onClick={resumeGame}
                    className="mt-5 px-5 py-3 bg-yellow-300 text-black border-4 border-black rounded-[10px] text-sm"
                    style={pxShadow()}
                  >
                    RESUME
                  </button>

                  <button
                    type="button"
                    className="mt-3 px-4 py-2 bg-white text-black border-4 border-black rounded-[10px] text-[10px]"
                    style={pxShadow()}
                    onClick={() => {
                      setLeaderboard([]);
                      window.localStorage.removeItem("ombrelli-heist-leaderboard");
                    }}
                  >
                    RESET SCORE
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase !== "playing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/65 flex items-center justify-center p-6"
              >
                <div
                  className="max-w-xl w-full rounded-[18px] border-4 border-black bg-[#6fc2ff] p-8 text-center text-black"
                  style={pxShadow()}
                >
                  <div className="text-3xl mb-4">{phase === "won" ? "🏆" : "☔"}</div>
                  <h2 className="text-2xl md:text-3xl text-red-600">
                    {phase === "won" ? "YOU WIN!" : "GAME OVER"}
                  </h2>
                  <p className="mt-4 text-[11px] leading-6 text-slate-950">{message}</p>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-left">
                    <div
                      className="rounded-[10px] border-4 border-black bg-white p-4"
                      style={pxShadow()}
                    >
                      <div className="text-[8px] text-slate-500 mb-1">TIME</div>
                      <div className="text-lg">{elapsed.toFixed(1)}s</div>
                    </div>
                    <div
                      className="rounded-[10px] border-4 border-black bg-white p-4"
                      style={pxShadow()}
                    >
                      <div className="text-[8px] text-slate-500 mb-1">SCORE</div>
                      <div className="text-lg">{score}</div>
                    </div>
                  </div>

                  <div
                    className="mt-5 rounded-[10px] border-4 border-black bg-white p-4 text-left"
                    style={pxShadow()}
                  >
                    <div className="text-[8px] text-slate-500 mb-2">LEADERBOARD</div>

                    {leaderboard.length === 0 ? (
                      <div className="text-[10px] text-slate-700">No scores yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {leaderboard.map((entry, index) => (
                          <div
                            key={`${entry.score}-${entry.time}-${entry.date}-${index}`}
                            className="flex items-center justify-between text-[10px] border-b border-slate-200 pb-1 last:border-b-0"
                          >
                            <span>#{index + 1}</span>
                            <span>{entry.score} pt</span>
                            <span>L{entry.level}</span>
                            <span>{entry.time.toFixed(1)}s</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="mt-6 px-6 py-3 bg-yellow-300 hover:bg-yellow-200 text-black border-4 border-black rounded-[10px] text-sm transition"
                    style={pxShadow()}
                    onClick={startGame}
                  >
                    TRY AGAIN
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}