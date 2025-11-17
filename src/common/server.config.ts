export const serverConfig = {
  openapi_provider: process.env.OPENAPI_PROVIDER || 'swagger-ui',

  passkey_rp_id: process.env.PASSKEY_RP_ID,
  passkey_rp_name: process.env.PASSKEY_RP_NAME,
  passkey_origin: process.env.PASSKEY_ORIGIN,
  passkey_challenge_ttl: +(process.env.PASSKEY_CHALLENGE_TTL || '60'),

  max_cores: +(process.env.MAX_CORES || '2'),
  port: +(process.env.PORT || '3000'),
  mongo_uri: process.env.MONGO_URI || '',
  session_ttl: +(process.env.SESSION_TTL || '86400'),
}
