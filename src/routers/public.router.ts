import Elysia from 'elysia';

export const publicGroup = new Elysia({ tags: ['Public'] })
  .get(
    '/health',
    () => ({ status: 'ok' }),
    {
      detail: {
        summary: 'Health check',
      }
    })
  .get(
    '/',
    ({ redirect }) => {
      return redirect('/openapi', 302);
    },
    {
      detail: {
        summary: 'Redirect to /openapi',
      }
    })
  .get(
    '/swagger',
    ({ redirect }) => {
      return redirect('/openapi', 302);
    },
    {
      detail: {
        summary: 'Redirect to /openapi',
      }
    });
