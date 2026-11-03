import { Params } from 'nestjs-pino';
import { v4 as uuidv4 } from 'uuid';

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

      genReqId: (req, res) => {
        const header = req.headers['x-request-id'];
        const requestId =
          typeof header === 'string' &&
          header.length > 0 &&
          header.length <= 128
            ? header
            : uuidv4();
        res.setHeader('X-Request-Id', requestId);
        return requestId;
      },

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
