import Elysia, { t } from "elysia";
import { logger } from "../common/logger";
import { authService, validateSessionGuard } from "../services/auth.service";
import { sessionRepository } from "../repository/redis/session.repository";

export const authGroup = new Elysia({ tags: ['Auth'], prefix: '/auth' })
  .post('/register',
    async ({ body }) => {
      logger.info(`Registering user ${body.username}`);
      return {
        data: await authService.signUp(body.username, body.password)
      };
    },
    {
      detail: {
        summary: 'Register',
        tags: ['Auth']
      },
      body: t.Object({
        username: t.String({
          pattern: '^[a-z0-9]+$'
        }),
        password: t.String()
      }),
      response: t.Object({
        data: t.Object({
          token: t.String(),
          expiresAt: t.Date()
        })
      })
    })
  .post('/login',
    async ({ body }) => {
      logger.info(`Logging in user ${body.username}`);
      return {
        data: await authService.signIn(body.username, body.password)
      }
    },
    {
      detail: {
        summary: 'Login',
        tags: ['Auth']
      },
      body: t.Object({
        username: t.String(),
        password: t.String()
      }),
      response: t.Object({
        data: t.Object({
          token: t.String(),
          expiresAt: t.Date()
        })
      })
    })
  .post('/logout',
    async ({ headers }) => {
      const token = headers.authorization?.split('Bearer ')[1] || '';
      await authService.signOut(token);
      return {
        data: {
          message: 'Logged out'
        }
      }
    },
    {
      beforeHandle: ({ headers }) => validateSessionGuard(headers),
      detail: {
        summary: 'Logout',
        tags: ['Auth']
      },
      response: t.Object({
        data: t.Object({
          message: t.String()
        })
      })
    }
  );