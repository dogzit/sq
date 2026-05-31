"use client";

import { useEffect } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import { useUser } from "@/lib/swr";
import { disconnectPusher, getPusherClient, userChannelName } from "@/lib/pusher-client";

interface IncomingNotif {
  id: string;
  type: string;
  title: string;
  body: string;
}

/**
 * Mount once at app shell. Subscribes the logged-in user to their personal
 * Pusher channel and pops a toast + revalidates the notification cache on each event.
 */
export default function RealtimeProvider() {
  const { user } = useUser();

  useEffect(() => {
    if (!user?.id) {
      disconnectPusher();
      return;
    }
    const client = getPusherClient();
    if (!client) return; // Pusher not configured — silently degrade to polling

    const channel = client.subscribe(userChannelName(user.id));

    const onNotif = (n: IncomingNotif) => {
      toast.message(n.title, { description: n.body });
      mutate("/api/notifications");
    };
    const onCoins = () => mutate("/api/auth/me");

    channel.bind("notification:new", onNotif);
    channel.bind("coins:changed", onCoins);

    return () => {
      channel.unbind("notification:new", onNotif);
      channel.unbind("coins:changed", onCoins);
      client.unsubscribe(userChannelName(user.id));
    };
  }, [user?.id]);

  return null;
}
