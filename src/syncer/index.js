const logger = require('../utils/logger');
const BinanceOrderbooksSyncerService = require('./service');
const config = require('../config/binance');
const eventManager = require('./utils/app-event-manager');
const run = require('./utils/run');

run(new BinanceOrderbooksSyncerService(config), eventManager)
  .catch((e) => logger.error(e.message));
