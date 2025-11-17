import { redis } from "bun";
import { RedisSession } from "../../model/session.type";

const generateKey = (token: string) => `session:${token}`;

export const sessionRepository = {
  set: async (token: string, value: string, ttl: number) => {
    await redis.set(generateKey(token), value, "EX", ttl);
  },
  get: async (token: string) => {
    const value = await redis.get(generateKey(token));
    return value ? JSON.parse(value) as RedisSession : null;
  },
  delete: async (token: string) => {
    await redis.del(generateKey(token));
  },
};
