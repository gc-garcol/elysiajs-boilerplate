import { Elysia } from 'elysia'
import { webauthnGroup, publicGroup, gameGroup, profileGroup } from './routers';
import { openapi, fromTypes } from '@elysiajs/openapi';
import { serverConfig } from './common/server.config';
import { errorInterceptor, responseInterceptor } from './routers/interceptors/interceptor';
import { bootstrap } from './bootstrap';
import { logger } from './common/logger';
import { authGroup } from './routers/auth.router';
import cors from '@elysiajs/cors';
import { OpenAPIProvider } from '@elysiajs/openapi/dist/types';
import staticPlugin from '@elysiajs/static';

await bootstrap();

const app = new Elysia()
    .use(cors())
    .use(staticPlugin())
    .use(openapi({
        references: fromTypes(),
        documentation: {
            info: {
                title: 'OpenAPI',
                version: '1.0.0'
            },
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                    }
                }
            }
        },
        provider: serverConfig.openapi_provider as OpenAPIProvider,
    }))
    .onError(errorInterceptor)
    // .mapResponse(responseInterceptor)
    // .use(gameGroup)
    .use(authGroup)
    .use(webauthnGroup)
    .use(profileGroup)
    .use(publicGroup)
    .listen(serverConfig.port)

logger.info(
    `🦊 Elysia is running at ${app.server?.url.toString()}`
);
