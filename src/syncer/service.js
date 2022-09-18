const logger = require('../utils/logger');
const BinanceSyncerClient = require('../binance/client');


class BinanceOrderbooksSyncerService {
  constructor(config) {
    this.client = new BinanceSyncerClient(config);
  }

  /**
   * Sync orderbooks
   *
   * @return {Promise<void>}
   */
  async startOrderbooksSync() {
    try {
      await this.client.initOrderbooksSync();
    } catch (error) {
      logger.error('Cannot start sync binance orderbooks', error.message);

      throw error;
    }
  }

  async stopOrderbooksSync() {
    try {
      await this.client.stopOrderbooksSync();
    } catch (error) {
      logger.error('Cannot stop binance orderbooks sync', error.message);

      throw error;
    }
  }

  /**
   * Clean orderbooks
   *
   * @returns {Promise<void>}
   */
  async cleanOrderbooks() {
    try {
      await this.client.cleanAllOrderbooks();
    } catch (error) {
      logger.error('Cannot clean binance orderbooks', error.message);

      throw error;
    }
  }
}

module.exports = BinanceOrderbooksSyncerService;
