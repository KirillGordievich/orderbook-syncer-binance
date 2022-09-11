const logger = require('../utils/logger');
const BinanceSyncOrderbooks = require('./service');
const config = require('../config/binance');
const eventManager = require('./utils/app-event-manager');
const run = require('./utils/run');

run(new BinanceSyncOrderbooks(config), eventManager)
  .catch((e) => logger.error(e.message));
