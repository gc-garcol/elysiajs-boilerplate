import { ErrorCodes, ElysiaError, HttpCodes } from "../common/error.type";
import { serverConfig } from "../common/server.config";
import { RedisSession } from "../model/session.type";
import { User } from "../model/user/user.schema";
import { sessionRepository } from "../repository/redis/session.repository";

export const extractToken = (headers: Record<string, string | undefined>) => {
  return headers.authorization?.split('Bearer ')?.[1];
}

export const validateSessionGuard = async (headers: Record<string, string | undefined>) => {
  const token = extractToken(headers);
  if (!token) {
    throw new ElysiaError(HttpCodes.Unauthorized, ErrorCodes.Unauthenticated, 'Unauthenticated');
  }
  const isAuthenticated = await validateSession(token);
  if (!isAuthenticated) {
    throw new ElysiaError(HttpCodes.Unauthorized, ErrorCodes.Unauthenticated, 'Unauthenticated');
  }
}

const validateSession = async (token: string) => {
  const session = await sessionRepository.get(token);
  return !!session;
}

export const authService = {
  signUp: async (username: string, password: string) => {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new ElysiaError(HttpCodes.BadRequest, ErrorCodes.InvalidRequest, 'User already exists');
    }

    const { hashed, salt } = await hashPassword(password);
    const user = await User.create({ username, hashedPassword: hashed, salt });
    await user.save();
    const token = await authService.generateToken(user.id, username);
    return {
      token,
      expiresAt: new Date(Date.now() + serverConfig.session_ttl * 1000),
    };
  },
  signIn: async (username: string, password: string) => {
    const user = await User.findOne({ username });
    if (!user) {
      throw new ElysiaError(HttpCodes.Unauthorized, ErrorCodes.Unauthenticated, 'User not found');
    }
    const isPasswordValid = await verifyPassword(password, user.salt, user.hashedPassword);
    if (!isPasswordValid) {
      throw new ElysiaError(HttpCodes.Unauthorized, ErrorCodes.Unauthenticated, 'Invalid password');
    }
    const token = await authService.generateToken(user.id, username);
    return {
      token,
      expiresAt: new Date(Date.now() + serverConfig.session_ttl * 1000),
    };
  },
  signOut: async (token: string) => {
    await sessionRepository.delete(token);
  },
  generateToken: async (userId: string, username: string) => {
    const token = crypto.randomUUID();
    await sessionRepository.set(token, JSON.stringify({ userId, username, ttl: serverConfig.session_ttl } as RedisSession), serverConfig.session_ttl);
    return token;
  },
}

async function hashPassword(password: string) {
  const salt = crypto.randomUUID();
  const hashed = await Bun.password.hash(password + salt, {
    algorithm: "argon2id",
    memoryCost: 4 * 1024, // 4MB
    timeCost: 3
  });

  return { hashed, salt };
}

async function verifyPassword(
  password: string,
  salt: string,
  hashed: string
) {
  return await Bun.password.verify(password + salt, hashed);
}

