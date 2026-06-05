"use client";

import { ReactNode } from "react";

/**
 * Two kinds of frames:
 *  - "ring": a glowing colored ring around the avatar.
 *  - "gradient": a rotating/animated padded gradient ring (avatar inside an inner circle).
 */
type FrameStyle =
  | {
      kind: "ring";
      ringClass: string;
      glowStyle?: React.CSSProperties;
      /** Animation class on the ring wrapper. */
      animClass?: string;
      /** CSS variable used by pulse animations. */
      frameColor?: string;
      /** Floating decoration (e.g. sparkles). */
      overlay?: ReactNode;
    }
  | {
      kind: "gradient";
      backgroundImage: string;
      glowStyle?: React.CSSProperties;
      /** Animation class on the gradient wrapper (e.g. spin / hue-rotate). */
      animClass?: string;
      padding?: number;
      overlay?: ReactNode;
    };

const FRAMES: Record<string, FrameStyle> = {
  // ── Original static frames ──
  "neon-ring": {
    kind: "ring",
    ringClass: "ring-2 ring-neon-purple/80",
    glowStyle: { boxShadow: "0 0 14px rgba(124, 92, 255, 0.55)" },
  },
  "fire-frame": {
    kind: "ring",
    ringClass: "ring-2 ring-orange-500",
    glowStyle: {
      boxShadow: "0 0 16px rgba(255, 120, 0, 0.7), inset 0 0 8px rgba(255, 180, 60, 0.4)",
    },
  },
  "ice-crown": {
    kind: "ring",
    ringClass: "ring-2 ring-cyan-300",
    glowStyle: {
      boxShadow: "0 0 16px rgba(120, 220, 255, 0.7), inset 0 0 8px rgba(200, 240, 255, 0.4)",
    },
  },
  "galaxy-border": {
    kind: "gradient",
    backgroundImage:
      "conic-gradient(from 0deg, #7C5CFF, #FF3DCB, #5CC8FF, #FFD45C, #7C5CFF)",
    glowStyle: { boxShadow: "0 0 18px rgba(124, 92, 255, 0.55)" },
    padding: 3,
  },
  "dragon-frame": {
    kind: "gradient",
    backgroundImage:
      "linear-gradient(135deg, #FFD45C 0%, #C9A227 40%, #FFD45C 60%, #8B5E00 100%)",
    glowStyle: { boxShadow: "0 0 22px rgba(255, 200, 50, 0.65)" },
    padding: 3,
  },

  // ── New ANIMATED frames (ML-style "alive" borders) ──
  "aurora-spin": {
    kind: "gradient",
    backgroundImage:
      "conic-gradient(from 0deg, #00ffd1, #7C5CFF, #FF3DCB, #5CC8FF, #00ffd1)",
    glowStyle: { boxShadow: "0 0 22px rgba(0, 255, 209, 0.65)" },
    animClass: "frame-anim-spin",
    padding: 3,
  },
  "rainbow-pulse": {
    kind: "gradient",
    backgroundImage:
      "conic-gradient(from 90deg, #ff595e, #ffca3a, #8ac926, #1982c4, #6a4c93, #ff595e)",
    glowStyle: { boxShadow: "0 0 22px rgba(255, 90, 200, 0.55)" },
    animClass: "frame-anim-hue",
    padding: 3,
  },
  "phoenix-pulse": {
    kind: "ring",
    ringClass: "ring-[3px] ring-orange-400",
    glowStyle: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ["--frame-color" as any]: "rgba(255, 120, 0, 0.85)",
    },
    animClass: "frame-anim-pulse",
    overlay: (
      <span className="pointer-events-none absolute -top-1 -right-1 text-sm select-none" aria-hidden>
        🔥
      </span>
    ),
  },
  "lightning-flicker": {
    kind: "ring",
    ringClass: "ring-2 ring-cyan-300",
    glowStyle: {},
    animClass: "frame-anim-flicker",
    overlay: (
      <span className="pointer-events-none absolute -top-1 -right-1 text-sm select-none" aria-hidden>
        ⚡
      </span>
    ),
  },
  "void-pulse": {
    kind: "ring",
    ringClass: "ring-[3px] ring-fuchsia-600",
    glowStyle: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ["--frame-color" as any]: "rgba(190, 60, 220, 0.85)",
    },
    animClass: "frame-anim-pulse",
  },
  "diamond-sparkle": {
    kind: "gradient",
    backgroundImage:
      "conic-gradient(from 45deg, #ffffff, #b0e0ff, #ffffff, #d8b6ff, #ffffff)",
    glowStyle: { boxShadow: "0 0 18px rgba(220, 240, 255, 0.85)" },
    animClass: "frame-anim-spin",
    padding: 3,
    overlay: (
      <span
        className="pointer-events-none absolute -top-1 -right-1 text-sm select-none frame-anim-sparkle"
        aria-hidden
      >
        ✨
      </span>
    ),
  },
  "eclipse-spin": {
    kind: "gradient",
    backgroundImage:
      "conic-gradient(from 0deg, #1a1a2e 0%, #ffd45c 25%, #1a1a2e 50%, #ff6ad5 75%, #1a1a2e 100%)",
    glowStyle: { boxShadow: "0 0 24px rgba(255, 212, 92, 0.55)" },
    animClass: "frame-anim-spin",
    padding: 3,
  },
  "cosmic-rainbow": {
    kind: "gradient",
    backgroundImage:
      "conic-gradient(from 270deg, #5CC8FF, #7C5CFF, #FF3DCB, #FFD45C, #00ffd1, #5CC8FF)",
    glowStyle: { boxShadow: "0 0 26px rgba(124, 92, 255, 0.7)" },
    animClass: "frame-anim-spin",
    padding: 4,
  },
};

export const FRAME_VALUES = Object.keys(FRAMES);

export function hasFrame(value?: string | null): value is string {
  return !!value && value in FRAMES;
}

interface Props {
  value?: string | null;
  size: number;
  children: ReactNode;
  className?: string;
}

/**
 * Wraps an avatar with the user's equipped decorative frame.
 * If no frame is equipped, renders the children unchanged.
 */
export default function AvatarFrame({ value, size, children, className = "" }: Props) {
  if (!hasFrame(value)) {
    return (
      <div className={className} style={{ width: size, height: size }}>
        {children}
      </div>
    );
  }

  const f = FRAMES[value];

  if (f.kind === "gradient") {
    const pad = f.padding ?? 3;
    return (
      <div
        className={`relative rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <div
          className={`absolute inset-0 rounded-full ${f.animClass ?? ""}`}
          style={{ backgroundImage: f.backgroundImage, ...f.glowStyle }}
        />
        <div
          className="absolute rounded-full overflow-hidden bg-background"
          style={{ top: pad, left: pad, right: pad, bottom: pad }}
        >
          {children}
        </div>
        {f.overlay}
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-full ${f.ringClass} ${f.animClass ?? ""} ${className}`}
      style={{ width: size, height: size, ...f.glowStyle }}
    >
      {children}
      {f.overlay}
    </div>
  );
}
