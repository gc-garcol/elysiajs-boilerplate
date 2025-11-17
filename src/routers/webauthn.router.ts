import Elysia, { t } from 'elysia';
import { webauthnService } from '../services/webauthn.service';
import { validateSessionGuard } from '../services/auth.service';

export const webauthnGroup = new Elysia({ tags: ['WebAuthn'], prefix: '/webauthn' })
    .post('/register-challenge',
        async ({ headers }) => {
            return {
                data: await webauthnService.handleRegisterChallenge(headers)
            };
        },
        {
            beforeHandle: ({ headers }) => validateSessionGuard(headers),
            detail: {
                summary: 'Register challenge',
                tags: ['WebAuthn']
            },
        })
    .post('/register',
        async ({ headers, body }) => {
            return {
                data: await webauthnService.handleRegister(headers, body.request)
            };
        },
        {
            beforeHandle: ({ headers }) => validateSessionGuard(headers),
            detail: {
                summary: 'Register Credential',
                tags: ['WebAuthn']
            },
            body: t.Object({
                request: t.String()
            }),
        })
    .post('/login-challenge',
        async ({ body }) => {
            return {
                data: await webauthnService.handleLoginChallenge(body.username)
            };
        },
        {
            detail: {
                summary: 'Login challenge',
                tags: ['WebAuthn']
            },
            body: t.Object({
                username: t.String()
            }),
        })
    .post('/login',
        async ({ body }) => {
            return {
                data: await webauthnService.handleLogin(body.request)
            };
        },
        {
            detail: {
                summary: 'Passkey Login',
                tags: ['WebAuthn']
            },
            body: t.Object({
                request: t.String()
            }),
        });
