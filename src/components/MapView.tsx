"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface FriendLocation {
  userId: string;
  username: string;
  displayName: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

interface MapViewProps {
  locations: FriendLocation[];
  myPosition: { lat: number; lng: number } | null;
}

const TILES = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
};

function createMarkerIcon(label: string, isSelf: boolean, isDark: boolean) {
  if (isDark) {
    const color = isSelf ? "#39ff14" : "#00f0ff";
    return L.divIcon({
      className: "custom-marker",
      html: `<div style="
        width: 36px; height: 36px;
        background: rgba(${isSelf ? "57,255,20" : "0,240,255"}, 0.2);
        border: 2px solid ${color};
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; font-weight: bold; color: ${color};
        box-shadow: 0 0 10px ${color}, 0 0 20px ${color}40;
      ">${label}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }

  const bg = isSelf ? "#7C5CFF" : "#0891b2";
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 36px; height: 36px;
      background: ${bg};
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: bold; color: #fff;
      box-shadow: 0 2px 8px ${bg}60;
    ">${label}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function useIsDark() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    setIsDark(root.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export default function MapView({ locations, myPosition }: MapViewProps) {
  const isDark = useIsDark();

  const center = myPosition
    ? [myPosition.lat, myPosition.lng]
    : locations.length > 0
      ? [locations[0].latitude, locations[0].longitude]
      : [47.9184, 106.9177]; // UB default

  return (
    <MapContainer
      center={center as [number, number]}
      zoom={14}
      className="w-full h-full"
      style={{ background: isDark ? "#0a0a0f" : "#f8f8f8" }}
    >
      <TileLayer
        attribution=""
        url={isDark ? TILES.dark : TILES.light}
      />

      {myPosition && (
        <Marker
          position={[myPosition.lat, myPosition.lng]}
          icon={createMarkerIcon("ME", true, isDark)}
        >
          <Popup>
            <span style={{ color: isDark ? "#39ff14" : "#7C5CFF" }}>Your location</span>
          </Popup>
        </Marker>
      )}

      {locations.map((loc) => (
        <Marker
          key={loc.userId}
          position={[loc.latitude, loc.longitude]}
          icon={createMarkerIcon(loc.displayName[0], false, isDark)}
        >
          <Popup>
            <div style={{ color: isDark ? "#00f0ff" : "#0891b2" }}>
              <strong>{loc.displayName}</strong>
              <br />
              @{loc.username}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
