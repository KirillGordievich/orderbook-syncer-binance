class Logger {
  constructor(logLevel) {
    this.logLevel = logLevel;
  }

  error(...args) {
    console.error.apply(null, args);
  }

  info(...args) {
    console.log.apply(null, args);
  }

  debug(...args) {
    if (LOG_LEVEL === 'debug') {
      this.info(...args);
    }
  }
}

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

module.exports = new Logger(LOG_LEVEL);
