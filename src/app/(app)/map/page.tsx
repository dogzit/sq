"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import { useLobbies, useLocations } from "@/lib/swr";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function MapPage() {
  const { lobbies } = useLobbies();
  const [selectedLobby, setSelectedLobby] = useState<string>("");
  const [sharing, setSharing] = useState(false);
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);

  const lobbyId = selectedLobby || lobbies?.[0]?.id || "";
  const { locations, fogOfWar, isLoading } = useLocations(lobbyId);

  // Auto-select first lobby
  if (!selectedLobby && lobbies?.length > 0 && lobbies[0].id !== selectedLobby) {
    setSelectedLobby(lobbies[0].id);
  }

  function toggleSharing() {
    if (sharing) {
      setSharing(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setMyPos({ lat: latitude, lng: longitude });
        setSharing(true);

        fetch("/api/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude, longitude, accuracy }),
        });

        navigator.geolocation.watchPosition((p) => {
          const { latitude: lat, longitude: lng, accuracy: acc } = p.coords;
          setMyPos({ lat, lng });
          fetch("/api/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude: lat, longitude: lng, accuracy: acc }),
          });
        });
      },
      () => alert("Location permission required"),
      { enableHighAccuracy: true }
    );
  }

  return (
    <>
      <TopBar
        title="MAP"
        rightAction={
          <button
            onClick={toggleSharing}
            className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${
              sharing
                ? "bg-[var(--neon-green)]/20 text-[var(--neon-green)] neon-glow-green"
                : "bg-[var(--bg-card)] text-[var(--text-secondary)]"
            }`}
          >
            {sharing ? "● LIVE" : "Share Location"}
          </button>
        }
      />

      <div className="px-4 py-3">
        {lobbies?.length > 0 && (
          <select
            value={selectedLobby}
            onChange={(e) => setSelectedLobby(e.target.value)}
            className="w-full bg-[var(--bg-card)] border border-[rgba(0,240,255,0.2)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--neon-cyan)] mb-3"
          >
            {lobbies.map((l: any) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        )}

        {/* Fog of War Banner */}
        {fogOfWar && !isLoading && (
          <div className="card-cyber neon-border-magenta p-4 text-center mb-3">
            <div className="text-3xl mb-2">🌫️</div>
            <h3 className="text-sm font-bold text-[var(--neon-magenta)]">FOG OF WAR</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Complete a quest and get approved to reveal friends&apos; locations for 1 hour
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 relative" style={{ height: "calc(100dvh - 220px)" }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-[var(--neon-cyan)] animate-pulse">Loading map...</div>
          </div>
        ) : (
          <MapView locations={fogOfWar ? [] : locations} myPosition={myPos} />
        )}
      </div>
    </>
  );
}
