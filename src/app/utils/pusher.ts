import Pusher, { type Channel, type ChannelAuthorizationHandler } from "pusher-js";
import { PUSHER_CLUSTER, PUSHER_KEY } from "./constants";
import { buildApiUrl } from "./helper";
import { getAuthSession, getAuthToken } from "./auth";

let pusherClient: Pusher | null = null;
let subscribedChannelName = "";

export const getPlatformUserChannelName = (userId: string) => `private-platform-user-${userId}`;

const createChannelAuthorizationHandler = (): ChannelAuthorizationHandler => {
  return async ({ socketId, channelName }, callback) => {
    try {
      const response = await fetch(buildApiUrl("platform/pusher/auth"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
        },
        body: JSON.stringify({
          socket_id: socketId,
          channel_name: channelName,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          (data && typeof data === "object" && "message" in data && String((data as { message?: unknown }).message)) ||
            (data && typeof data === "object" && "error" in data && String((data as { error?: unknown }).error)) ||
            "Pusher channel authorization failed."
        );
      }

      callback(null, data);
    } catch (error) {
      callback(error instanceof Error ? error : new Error("Pusher channel authorization failed."), null);
    }
  };
};

export const getPlatformPusherClient = () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (pusherClient) {
    return pusherClient;
  }

  Pusher.logToConsole = import.meta.env.DEV;

  pusherClient = new Pusher(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
    forceTLS: true,
    channelAuthorization: {
      customHandler: createChannelAuthorizationHandler(),
    },
  });

  pusherClient.connect();
  return pusherClient;
};

export const connectPlatformUserChannel = (userId?: string): Channel | null => {
  const session = getAuthSession();
  const resolvedUserId = userId || session?.user.id;

  if (!resolvedUserId) {
    return null;
  }

  const client = getPlatformPusherClient();
  if (!client) {
    return null;
  }

  const channelName = getPlatformUserChannelName(resolvedUserId);

  if (subscribedChannelName && subscribedChannelName !== channelName) {
    client.unsubscribe(subscribedChannelName);
  }

  subscribedChannelName = channelName;
  return client.subscribe(channelName);
};

export const disconnectPlatformPusher = () => {
  if (!pusherClient) {
    subscribedChannelName = "";
    return;
  }

  if (subscribedChannelName) {
    pusherClient.unsubscribe(subscribedChannelName);
  }

  pusherClient.disconnect();
  pusherClient = null;
  subscribedChannelName = "";
};
