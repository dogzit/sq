"use client";

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

function createNeonIcon(label: string, isSelf: boolean) {
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

export default function MapView({ locations, myPosition }: MapViewProps) {
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
      style={{ background: "#0a0a0f" }}
    >
      <TileLayer
        attribution=""
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {myPosition && (
        <Marker
          position={[myPosition.lat, myPosition.lng]}
          icon={createNeonIcon("ME", true)}
        >
          <Popup>
            <span style={{ color: "#39ff14" }}>Your location</span>
          </Popup>
        </Marker>
      )}

      {locations.map((loc) => (
        <Marker
          key={loc.userId}
          position={[loc.latitude, loc.longitude]}
          icon={createNeonIcon(loc.displayName[0], false)}
        >
          <Popup>
            <div style={{ color: "#00f0ff" }}>
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
