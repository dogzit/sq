"use client";

import Link from "next/link";

interface User {
  id?: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

interface Props {
  user: User;
  size?: number;
  href?: string | null;
  linkToProfile?: boolean;
  ring?: boolean;
  className?: string;
}

export default function UserAvatar({
  user,
  size = 40,
  href,
  linkToProfile = true,
  ring = false,
  className = "",
}: Props) {
  const initials = (user.displayName || user.username || "?")[0]?.toUpperCase() || "?";
  const targetHref = href ?? (linkToProfile && user.username ? `/users/${user.username}` : null);

  const inner = (
    <div
      className={`rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-cyan-600/30 to-purple-600/30 flex items-center justify-center text-white font-bold ${
        ring ? "ring-2 ring-neon-purple/40" : ""
      } ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
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

  if (targetHref) {
    return (
      <Link href={targetHref} className="flex-shrink-0 hover:opacity-80 transition-opacity">
        {inner}
      </Link>
    );
  }
  return inner;
}
