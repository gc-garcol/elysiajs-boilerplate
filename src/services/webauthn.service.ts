import { AuthenticationResponseJSON, generateAuthenticationOptions, generateRegistrationOptions, RegistrationResponseJSON, verifyAuthenticationResponse, verifyRegistrationResponse } from "@simplewebauthn/server";
import { decodeClientDataJSON } from '@simplewebauthn/server/helpers';
import { authService, extractToken } from "./auth.service";
import { serverConfig } from "../common/server.config";
import { sessionRepository } from "../repository/redis/session.repository";
import { RedisSession } from "../model/session.type";
import { ErrorCodes, ElysiaError, HttpCodes } from "../common/error.type";
import { challengeRepository } from "../repository/redis/challenge.repository";
import { PasskeyCridential } from "../model/user/passkey.cridential";
import { User } from "../model/user/user.schema";

const generateChallenge = () => {
  return crypto.randomUUID();
}

export const webauthnService = {
  handleRegisterChallenge: async (headers: Record<string, string | undefined>): Promise<PublicKeyCredentialCreationOptionsJSON> => {
    const token = extractToken(headers)!;
    const redisSession: RedisSession | null = await sessionRepository.get(token);
    if (!redisSession) {
      throw new ElysiaError(HttpCodes.Unauthorized, ErrorCodes.Unauthenticated, 'Unauthenticated');
    }

    const challenge = generateChallenge();

    const options = await generateRegistrationOptions({
      rpName: serverConfig.passkey_rp_name || '',
      rpID: serverConfig.passkey_rp_id || '',
      challenge,
      userID: new TextEncoder().encode(redisSession.userId),
      userName: redisSession.username,
      excludeCredentials: [], // todo: Don't new authenticators that are already registered
    });
    const base64Challenge = options.challenge;
    await challengeRepository.setRegisterChallenge(base64Challenge, serverConfig.passkey_challenge_ttl);
    return options;
  },
  handleRegister: async (headers: Record<string, string | undefined>, request: string) => {
    const token = extractToken(headers)!;
    const redisSession: RedisSession | null = await sessionRepository.get(token);
    if (!redisSession) {
      throw new ElysiaError(HttpCodes.Unauthorized, ErrorCodes.Unauthenticated, 'Unauthenticated');
    }

    const registrationResponse = JSON.parse(request) as RegistrationResponseJSON;
    const clientDataJSON = decodeClientDataJSON(registrationResponse.response.clientDataJSON);
    const challenge = clientDataJSON.challenge;
    const storedChallenge = await challengeRepository.getRegisterChallenge(challenge);
    if (!storedChallenge) {
      throw new ElysiaError(HttpCodes.BadRequest, ErrorCodes.InvalidRequest, 'Must register challenge first');
    }

    const verification = await verifyRegistrationResponse({
      expectedChallenge: challenge,
      response: registrationResponse,
      // expectedOrigin: serverConfig.passkey_origin || '',
      expectedOrigin: clientDataJSON.origin, // todo by passkey origin
      expectedRPID: serverConfig.passkey_rp_id || '',
    });

    if (!verification.verified) {
      throw new ElysiaError(HttpCodes.BadRequest, ErrorCodes.InvalidRequest, 'Invalid registration response');
    }

    challengeRepository.deleteRegisterChallenge(challenge);

    const credential = {
      id: verification.registrationInfo?.credential.id || '',
      publicKey: verification.registrationInfo?.credential.publicKey,
      counter: verification.registrationInfo?.credential.counter,
      transports: verification.registrationInfo?.credential.transports,
    };

    await PasskeyCridential.create({
      userId: redisSession.userId,
      credentialId: credential.id,
      credential: JSON.stringify(credential),
    });

    return "ok";
  },
  handleLoginChallenge: async (username: string) => {
    const user = await User.findOne({ username });
    if (!user) {
      throw new ElysiaError(HttpCodes.BadRequest, ErrorCodes.InvalidRequest, 'User not found');
    }

    const credentials = await PasskeyCridential.find({ userId: user.id });
    if (credentials.length === 0) {
      throw new ElysiaError(HttpCodes.BadRequest, ErrorCodes.InvalidRequest, 'No credentials found');
    }

    const allowCredentials = credentials.map((credential: PasskeyCridential) => ({
      id: credential.credentialId,
      transports: JSON.parse(credential.credential).transports,
    }));

    const challenge = generateChallenge();
    const options = await generateAuthenticationOptions({
      challenge: challenge,
      rpID: serverConfig.passkey_rp_id || '',
      allowCredentials: allowCredentials,
    });
    const base64Challenge = options.challenge;
    await challengeRepository.setLoginChallenge(base64Challenge, serverConfig.passkey_challenge_ttl);
    return options;
  },
  handleLogin: async (request: string) => {
    const authenticationResponse = JSON.parse(request) as AuthenticationResponseJSON;
    const credentialId = authenticationResponse.id;
    const credentialEntity: any = await PasskeyCridential.findOne({ credentialId });
    if (!credentialEntity) {
      throw new ElysiaError(HttpCodes.BadRequest, ErrorCodes.InvalidRequest, 'Credential is not register yet');
    }

    const clientDataJSON = decodeClientDataJSON(authenticationResponse.response.clientDataJSON);
    const challenge = clientDataJSON.challenge;
    const storedChallenge = await challengeRepository.getLoginChallenge(challenge);
    if (!storedChallenge) {
      throw new ElysiaError(HttpCodes.BadRequest, ErrorCodes.InvalidRequest, 'Must login challenge first');
    }

    const credential = JSON.parse(credentialEntity.credential);

    const verification = await verifyAuthenticationResponse({
      expectedChallenge: challenge,
      response: authenticationResponse,
      expectedOrigin: clientDataJSON.origin,
      expectedRPID: serverConfig.passkey_rp_id || '',
      credential: {
        id: credentialId,
        publicKey: new Uint8Array(Object.values(credential.publicKey)),
        counter: credential.counter,
        transports: credential.transports,
      }
    });

    if (!verification.verified) {
      throw new ElysiaError(HttpCodes.BadRequest, ErrorCodes.InvalidRequest, 'Invalid authentication response');
    }

    challengeRepository.deleteLoginChallenge(challenge);

    const userId = credentialEntity.userId;
    const user = await User.findById(userId);
    if (!user) {
      throw new ElysiaError(HttpCodes.BadRequest, ErrorCodes.InvalidRequest, 'User not found');
    }
    const token = await authService.generateToken(user.id, user.username);
    return {
      token,
      expiresAt: new Date(Date.now() + serverConfig.session_ttl * 1000),
    };
  }
}
