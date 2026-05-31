import Pusher from "pusher";

let _pusher: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (_pusher) return _pusher;
  const {
    PUSHER_APP_ID: appId,
    PUSHER_KEY: key,
    PUSHER_SECRET: secret,
    PUSHER_CLUSTER: cluster,
  } = process.env;
  if (!appId || !key || !secret || !cluster) {
    return null; // not configured — calls become no-ops
  }
  _pusher = new Pusher({ appId, key, secret, cluster, useTLS: true });
  return _pusher;
}

/** Fire-and-forget trigger. Safe to call without await. */
export function pushTo(channel: string, event: string, payload: unknown): void {
  const p = getPusherServer();
  if (!p) return;
  p.trigger(channel, event, payload).catch(() => {
    /* swallow — caller's DB write already succeeded, polling will catch up */
  });
}

export function userChannel(userId: string): string {
  return `private-user-${userId}`;
}

export function matchChannel(matchId: string): string {
  return `private-match-${matchId}`;
}

export function lobbyChannel(lobbyId: string): string {
  return `private-lobby-${lobbyId}`;
}
