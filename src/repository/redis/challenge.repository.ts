import { redis } from "bun";

const generateRegisterChallengeKey = (challenge: string) => `challenge-register:${challenge}`;
const generateLoginChallengeKey = (challenge: string) => `challenge-login:${challenge}`;


export const challengeRepository = {
  setRegisterChallenge: async (challenge: string, ttl: number) => {
    await redis.set(generateRegisterChallengeKey(challenge), challenge, "EX", ttl);
  },
  getRegisterChallenge: async (challenge: string) => {
    return await redis.get(generateRegisterChallengeKey(challenge));
  },
  deleteRegisterChallenge: async (challenge: string) => {
    await redis.del(generateRegisterChallengeKey(challenge));
  },
  setLoginChallenge: async (challenge: string, ttl: number) => {
    await redis.set(generateLoginChallengeKey(challenge), challenge, "EX", ttl);
  },
  getLoginChallenge: async (challenge: string) => {
    return await redis.get(generateLoginChallengeKey(challenge));
  },
  deleteLoginChallenge: async (challenge: string) => {
    await redis.del(generateLoginChallengeKey(challenge));
  },
};
