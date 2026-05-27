const winston = require('winston');
const { format } = winston;

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(logColors);

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const consoleFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

const transports = [
  new winston.transports.Console({
    format: consoleFormat
  }),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: logFormat
  }),
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: logFormat
  })
];

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: logFormat,
  transports,
  exitOnError: false
});

module.exports = logger;