import { createClient, RedisClientType } from "redis";
import { env } from "./env";
import { logger } from "./logger";

export let redisClient: RedisClientType;

export async function connectRedis(): Promise<void> {
  redisClient = createClient({
    socket: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
    },
    password: env.REDIS_PASSWORD || undefined,
  }) as RedisClientType;

  redisClient.on("error", (err) => logger.error("Redis client error:", err));
  redisClient.on("reconnecting", () => logger.warn("Redis reconnecting..."));

  await redisClient.connect();
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redisClient.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = env.REDIS_TTL,
): Promise<void> {
  await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
}

export async function deleteCache(...keys: string[]): Promise<void> {
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
}

export async function deletePattern(pattern: string): Promise<void> {
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
}
