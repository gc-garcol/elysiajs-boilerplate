import Elysia from "elysia";
import { extractToken, validateSessionGuard } from "../services/auth.service";
import { profileService } from "../services/profile.service";

export const profileGroup = new Elysia({ tags: ['Profile'], prefix: '/profile' })
  .get(
    '/me',
    async ({ headers }) => {
      const token = extractToken(headers)!;
      return {
        data: await profileService.getUserProfile(token)
      };
    },
    {
      beforeHandle: ({ headers }) => validateSessionGuard(headers),
      detail: {
        summary: 'Get user profile',
        tags: ['Profile']
      }
    }
  );
