import pino from 'pino'
import pinoHttp from 'pino-http'

export const logger = pinoHttp({
  logger: pino({
    level: 'info',
  }),
}).logger;
