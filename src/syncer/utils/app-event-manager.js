const { EventEmitter } = require('events');
const logger = require('../../utils/logger');

const MAX_SERVICE_RESTARTS_COUNT = process.env.APP_MAX_RESTARTS_COUNT || 5;
const APP_RESET_SERVICE_RESTARTS_COUNT_MS = Number(process.env.APP_RESET_SERVICE_RESTARTS_COUNT_MS) || 600000; // default is 10 minutes

class AppEventManager extends EventEmitter {
  constructor() {
    super();
    this.restarting = false;
    this.terminating = false;
    this.serviceRestartCount = 0;
    this.addResetServiceRestartsCounterJob();
  }

  addResetServiceRestartsCounterJob() {
    setInterval(
      this.resetServiceRestartsCounter,
      APP_RESET_SERVICE_RESTARTS_COUNT_MS,
    );
  }

  restart(error) {
    if (this.terminating || this.restarting) {
      return;
    }

    logger.info('APP RESTART');

    this.restarting = true;

    if (this.serviceRestartCount >= MAX_SERVICE_RESTARTS_COUNT) {
      logger.info(`TOO MANY RESTARTS (${MAX_SERVICE_RESTARTS_COUNT}). TERMINATE APP`);

      this.terminating = true;
      this.emit('terminate', error);

      return;
    }

    this.serviceRestartCount += 1;
    logger.debug('APP RESTARTING COUNT', this.serviceRestartCount);

    this.emit('restart', error);
  }

  resetRestarting() {
    this.restarting = false;
  }

  resetServiceRestartsCounter() {
    this.serviceRestartCount = 0;
  }
}

module.exports = new AppEventManager();
