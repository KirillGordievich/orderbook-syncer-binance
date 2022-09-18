const logger = require('../utils/logger');
const ApiClient = require('../binance/api-client/index');
const timeout = require('../utils/timeout');
const buildRedisClient = require('../redis/client-builder');


class BinanceClient {
  constructor(config) {
    this.type = 'binance';
    this.apiClient = new ApiClient(config);
    this.redisClient = null;
    this.wsClient = null;
  }

  /**
   * Init synchronization orderbooks data
   *
   * @returns {Promise<void>}
   */
  async initOrderbooksSync() {
    await this.initRedisClient();

    try {
      logger.info('Start sync orderbook data');
    } catch (e) {
      e.message = `orderbookSyncerService:startOrderbooksSync() -> ${e.message}`;

      throw new Error(e);
    }
  }

  async stopOrderbooksSync() {
    try {
      logger.info('Stop sync orderbook data');
      // todo: complete this method
    } catch (e) {
      e.message = `orderbookSyncerService:stopOrderbooksSync() -> ${e.message}`;

      throw new Error(e);
    }
  }

  async initRedisClient() {
    this.redisClient = await buildRedisClient();
  }
}

module.exports = BinanceClient;
