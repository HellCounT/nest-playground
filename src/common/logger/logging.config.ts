import { Params } from 'nestjs-pino';
import { getOrCreateRequestId } from '../request-context/get-or-create-request-id.helper.js';

export enum LogLevel {
  FATAL = 'fatal',
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
  SILENT = 'silent',
}

interface LoggingConfig {
  level: LogLevel;
  pretty: boolean;
  http: boolean;
}

export function createLoggingConfig(config: LoggingConfig): Params {
  return {
    pinoHttp: {
      level: config.level,
      autoLogging: config.http,

      genReqId: (req) => getOrCreateRequestId(req),

      customProps: (req) => ({
        requestId: getOrCreateRequestId(req),
      }),

      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) {
          return 'error';
        }
        if (res.statusCode >= 400) {
          return 'warn';
        }
        return 'info';
      },

      serializers: {
        req: (req) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res) => ({
          statusCode: res.statusCode,
        }),
      },

      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'header.authorization',
          'headers.cookie',
          'password',
          'passwordHash',
          'accessToken',
          'refreshToken',
          'body.password',
          'body.accessToken',
        ],
        censor: '[REDACTED]',
      },

      transport: config.pretty
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              singleLine: true,
            },
          }
        : undefined,
    },
  };
}
