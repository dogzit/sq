import { pushTo, userChannel, matchChannel } from "@/lib/pusher-server";

/** Push a real-time event to a single user. */
export function pushToUser(userId: string, event: string, payload: unknown): void {
  pushTo(userChannel(userId), event, payload);
}

/** Push a real-time event to both players of a match. */
export function pushToMatch(matchId: string, event: string, payload: unknown): void {
  pushTo(matchChannel(matchId), event, payload);
}
