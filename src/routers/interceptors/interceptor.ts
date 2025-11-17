import { ElysiaError } from '../../common/error.type';
import { logger } from '../../common/logger';

export const errorInterceptor = ({ error, code, status }: any) => {
  logger.error(error);
  if (error instanceof ElysiaError) {
    return status(error.status, {
      error: {
        code: error.code,
        message: error.message,
      }
    });
  }
  return status(500, {
    error: {
      code: code,
      message: error.message ?? 'Internal server error',
    }
  });
};

export const responseInterceptor = ({ responseValue, set }: any) => {
  // Skip mapping for error responses (4xx, 5xx) - onError
  if (typeof set.status === 'number' && set.status >= 400) {
    return;
  }

  const isJson = typeof responseValue === 'object';

  const text = isJson
    ? JSON.stringify({
      data: responseValue,
    })
    : (responseValue?.toString() ?? '');

  return new Response(text, {
    headers: {
      'Content-Type': `${isJson ? 'application/json' : 'text/plain'
        }; charset=utf-8`
    }
  });
};

