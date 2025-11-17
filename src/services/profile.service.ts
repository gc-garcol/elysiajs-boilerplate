import { ErrorCodes, ElysiaError, HttpCodes } from "../common/error.type";
import { User } from "../model/user/user.schema";
import { sessionRepository } from "../repository/redis/session.repository";

export const profileService = {
  getUserProfile: async (token: string) => {
    const redisSession = await sessionRepository.get(token);
    if (!redisSession) {
      throw new ElysiaError(HttpCodes.Unauthorized, ErrorCodes.Unauthenticated, 'Unauthenticated');
    }
    const username = redisSession?.username;
    const user = await User.findOne({ username });
    if (!user) {
      throw new ElysiaError(HttpCodes.NotFound, ErrorCodes.NotFound, 'User not found');
    }
    return {
      id: user?._id,
      username: user?.username,
      createdAt: user?.createdAt,
      updatedAt: user?.updatedAt,
    };
  }
}
