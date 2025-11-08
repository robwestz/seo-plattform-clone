import pino from 'pino';

const logLevel = process.env.LOG_LEVEL || 'info';
const pretty = process.env.LOG_PRETTY === 'true';

export const logger = pino({
  level: logLevel,
  transport: pretty
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
