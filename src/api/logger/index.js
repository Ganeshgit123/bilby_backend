const { createLogger, format, transports } = require('winston');
const log = require('./console-logger'); 

const logFormatter = format.printf((info) => {
  const {
    timestamp, level, stack, message,
  } = info;
  const errorMessage = stack || message;
  return `${timestamp} ${level}: ${errorMessage}`;
});


const logToFile = createLogger({
  transports: [
    new transports.File({
      json: true,
      maxFiles: 5,
      level: 'error',
      colorize: false,
      filename: 'logs/error.log',
      maxsize: 5242880, // 5MB
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD hh:mm:ss A ZZ'
        }),
        format.json(),
        logFormatter
      ),
    }),
    new transports.File({
      json: true,
      maxFiles: 5,
      level: 'info',
      colorize: false,
      filename: 'logs/error.log',
      maxsize: 5242880, // 5MB
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD hh:mm:ss A ZZ'
        }),
        format.json(),
        logFormatter
      ),
    }),
  ],
});

const logToConsole = createLogger({
  level: 'info',
  format: format.errors({ stack: true }),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple(), format.timestamp(), logFormatter),
    }),
    new transports.File({
      json: true,
      maxFiles: 5,
      level: 'error',
      colorize: false,
      filename: 'logs/error.log',
      maxsize: 5242880, // 5MB
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD hh:mm:ss A ZZ'
        }),
        format.json(),
        logFormatter
      ),
    }),
    new transports.File({
      json: true,
      maxFiles: 5,
      level: 'info',
      colorize: false,
      filename: 'logs/error.log',
      maxsize: 5242880, // 5MB
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD hh:mm:ss A ZZ'
        }),
        format.json(),
        logFormatter
      ),
    }),
  ],
});


module.exports = {
  log,
  logToFile,
  logToConsole,
};
