"use client";

import { ReactNode } from "react";

interface FrameStyle {
  ringClass: string;
  glowStyle?: React.CSSProperties;
  decoration?: ReactNode;
}

const FRAMES: Record<string, FrameStyle> = {
  "neon-ring": {
    ringClass: "ring-2 ring-neon-purple/80",
    glowStyle: { boxShadow: "0 0 14px rgba(124, 92, 255, 0.55)" },
  },
  "fire-frame": {
    ringClass: "ring-2 ring-orange-500",
    glowStyle: {
      boxShadow:
        "0 0 16px rgba(255, 120, 0, 0.7), inset 0 0 8px rgba(255, 180, 60, 0.4)",
    },
  },
  "ice-crown": {
    ringClass: "ring-2 ring-cyan-300",
    glowStyle: {
      boxShadow:
        "0 0 16px rgba(120, 220, 255, 0.7), inset 0 0 8px rgba(200, 240, 255, 0.4)",
    },
  },
  "galaxy-border": {
    ringClass: "ring-[3px] ring-transparent",
    glowStyle: {
      backgroundImage:
        "conic-gradient(from 0deg, #7C5CFF, #FF3DCB, #5CC8FF, #FFD45C, #7C5CFF)",
      backgroundClip: "border-box",
      padding: 3,
      boxShadow: "0 0 18px rgba(124, 92, 255, 0.55)",
    },
  },
  "dragon-frame": {
    ringClass: "ring-[3px] ring-amber-400",
    glowStyle: {
      backgroundImage:
        "linear-gradient(135deg, #FFD45C 0%, #C9A227 40%, #FFD45C 60%, #8B5E00 100%)",
      backgroundClip: "border-box",
      padding: 3,
      boxShadow: "0 0 22px rgba(255, 200, 50, 0.65)",
    },
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

  // Gradient-padded frames (galaxy / dragon) use a wrapping div with bg image,
  // and an inner circle that holds the avatar.
  if (f.glowStyle?.backgroundImage) {
    return (
      <div
        className={`relative rounded-full ${className}`}
        style={{ width: size, height: size, ...f.glowStyle }}
      >
        <div
          className="w-full h-full rounded-full overflow-hidden bg-background"
          style={{ width: "100%", height: "100%" }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-full ${f.ringClass} ${className}`}
      style={{ width: size, height: size, ...f.glowStyle }}
    >
      {children}
    </div>
  );
}
