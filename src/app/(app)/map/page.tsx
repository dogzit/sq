"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import { useLobbies, useLocations } from "@/lib/swr";
import { FadeIn } from "@/components/AnimatedList";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function MapPage() {
  const { lobbies } = useLobbies();
  const [selectedLobby, setSelectedLobby] = useState<string>("");
  const [sharing, setSharing] = useState(false);
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);

  const lobbyId = selectedLobby || lobbies?.[0]?.id || "";
  const { locations, fogOfWar, isLoading } = useLocations(lobbyId);

  if (!selectedLobby && lobbies?.length > 0 && lobbies[0].id !== selectedLobby) {
    setSelectedLobby(lobbies[0].id);
  }

  const [watchId, setWatchId] = useState<number | null>(null);

  // Clean up watcher on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  function toggleSharing() {
    if (sharing) {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
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
        const id = navigator.geolocation.watchPosition((p) => {
          const { latitude: lat, longitude: lng, accuracy: acc } = p.coords;
          setMyPos({ lat, lng });
          fetch("/api/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude: lat, longitude: lng, accuracy: acc }),
          });
        });
        setWatchId(id);
      },
      () => alert("Location permission required"),
      { enableHighAccuracy: true }
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] overflow-hidden">
      <TopBar
        title="Map"
        rightAction={
          <button
            onClick={toggleSharing}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
              sharing
                ? "bg-neon-green/15 text-neon-green ring-1 ring-neon-green/30"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {sharing ? "● LIVE" : "Share Location"}
          </button>
        }
      />

      <div className="px-4 py-3 flex-shrink-0">
        {lobbies?.length > 0 && (
          <select
            value={selectedLobby}
            onChange={(e) => setSelectedLobby(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-neon-purple/40 mb-3"
          >
            {lobbies.map((l: any) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        )}

        {fogOfWar && !isLoading && (
          <FadeIn>
            <div className="game-card p-5 text-center mb-3">
              <div className="text-3xl mb-2">🌫️</div>
              <h3 className="font-display text-sm font-semibold">Fog of War</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Complete a quest and get approved to reveal friends&apos; locations
              </p>
            </div>
          </FadeIn>
        )}
      </div>

      <div className="flex-1 min-h-0 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground animate-pulse font-display">Loading map...</div>
          </div>
        ) : (
          <MapView locations={fogOfWar ? [] : locations} myPosition={myPos} />
        )}
      </div>
    </div>
  );
}
