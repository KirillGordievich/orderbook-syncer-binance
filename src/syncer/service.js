const logger = require('../utils/logger');
const ApiClient = require('../binance/api-client/index');


class OrderBookSyncerService {
  constructor(config) {
    this.apiClient = new ApiClient(config);
    this.wsClient = null;
  }

  /**
   * Start synchronization orderbook data by websocket
   *
   * @returns {Promise<void>}
   */
  async startOrderbooksSync() {
    try {
      logger.info('Start sync orderbook data');
      // todo: complete this method
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
}

module.exports = OrderBookSyncerService;
