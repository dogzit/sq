"use client";

import Link from "next/link";
import AvatarFrame, { hasFrame } from "./AvatarFrame";

interface User {
  id?: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  equippedFrameValue?: string | null;
}

interface Props {
  user: User;
  size?: number;
  href?: string | null;
  linkToProfile?: boolean;
  ring?: boolean;
  className?: string;
  /** Override the frame value (e.g. for shop previews). Defaults to user.equippedFrameValue. */
  frameValue?: string | null;
}

export default function UserAvatar({
  user,
  size = 40,
  href,
  linkToProfile = true,
  ring = false,
  className = "",
  frameValue,
}: Props) {
  const initials = (user.displayName || user.username || "?")[0]?.toUpperCase() || "?";
  const targetHref = href ?? (linkToProfile && user.username ? `/users/${user.username}` : null);
  const effectiveFrame = frameValue ?? user.equippedFrameValue ?? null;
  const showRing = ring && !hasFrame(effectiveFrame);

  const circle = (
    <div
      className={`w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-cyan-600/30 to-purple-600/30 flex items-center justify-center text-white font-bold ${
        showRing ? "ring-2 ring-neon-purple/40" : ""
      }`}
      style={{ fontSize: size * 0.4 }}
    >
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatarUrl}
          alt={user.displayName || user.username || ""}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );

  const inner = (
    <AvatarFrame value={effectiveFrame} size={size} className={`flex-shrink-0 ${className}`}>
      {circle}
    </AvatarFrame>
  );

  if (targetHref) {
    return (
      <Link href={targetHref} className="flex-shrink-0 hover:opacity-80 transition-opacity">
        {inner}
      </Link>
    );
  }
  return inner;
}
