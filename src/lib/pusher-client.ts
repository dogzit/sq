"use client";

import Pusher from "pusher-js";

let _client: Pusher | null = null;

export function getPusherClient(): Pusher | null {
  if (_client) return _client;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) return null;

  _client = new Pusher(key, {
    cluster,
    authEndpoint: "/api/pusher/auth",
    forceTLS: true,
  });
  return _client;
}

export function userChannelName(userId: string): string {
  return `private-user-${userId}`;
}

export function matchChannelName(matchId: string): string {
  return `private-match-${matchId}`;
}

export function lobbyChannelName(lobbyId: string): string {
  return `private-lobby-${lobbyId}`;
}

export function disconnectPusher() {
  if (_client) {
    _client.disconnect();
    _client = null;
  }
}
