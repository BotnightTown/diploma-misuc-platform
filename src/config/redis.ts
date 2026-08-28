import { Redis } from "ioredis";
import { env } from "./env.ts";

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redis.on("error", (err) => console.error("Redis error:", err));

// Separate connection for pub/sub: ioredis puts a client into subscriber
// mode once .subscribe() is called, after which it can no longer run
// regular commands — so `redis` above stays free for normal use.
export const redisSub = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redisSub.on("error", (err) => console.error("Redis subscriber error:", err));

type ChannelHandler = (message: string) => void;

const channelHandlers = new Map<string, Set<ChannelHandler>>();

redisSub.on("message", (channel, message) => {
  const handlers = channelHandlers.get(channel);
  if (!handlers) return;
  for (const handler of handlers) handler(message);
});

export async function subscribe(channel: string, handler: ChannelHandler) {
  const isNewChannel = !channelHandlers.has(channel);
  if (isNewChannel) channelHandlers.set(channel, new Set());
  channelHandlers.get(channel)!.add(handler);

  if (isNewChannel) await redisSub.subscribe(channel);
}

export async function unsubscribe(channel: string, handler: ChannelHandler) {
  const handlers = channelHandlers.get(channel);
  if (!handlers) return;

  handlers.delete(handler);
  if (handlers.size === 0) {
    channelHandlers.delete(channel);
    await redisSub.unsubscribe(channel);
  }
}
