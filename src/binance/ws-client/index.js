const timeout = require('../../utils/timeout');
const logger = require('../../utils/logger');
const DefaultWsClient = require('./utils/default-ws-client');

const connectionError = new Error('No opened websocket connection');
const QUEUE_TIMEOUT_MS = 1000;
const BINANCE_MAX_SYMBOLS_SUBSCRIPTIONS_COUNT = 1000;

class BinanceWsClient extends DefaultWsClient {
  constructor(eventManager) {
    super(eventManager);

    this.id = 0;
    this.subscribeQueue = [];
    this.subscribeQueueTimer = null;
    this.unsubscribeQueue = [];

    this.addEventQueueHandler();
  }

  /**
   * Send subscribe message to WSS orderbook channel
   *
   * @param {string} symbol - Symbol
   * @returns {Promise<void>}
   */
  async subscribeOrderbook(symbol) {
    if (this.unsubscribeQueue.includes(symbol)) {
      this.unsubscribeQueue.splice(this.unsubscribeQueue.indexOf(symbol), 1);
      logger.info(`Try to subscribe symbols ${symbol} that is in unsubscribeQueue`);
    }

    !this.subscribeQueue.includes(symbol)
      ? this.subscribeQueue.push(symbol)
      : logger.info(`Try to subscribe symbols ${symbol} that is already in subscribeQueue`);
  }

  async _subscribeOrderbookQueueHandler(symbols) {
    return new Promise((resolve) => {
      if (!this.ws) {
        logger.error(connectionError.message);
        this.eventManager.restart(connectionError);

        return;
      }

      if (!Array.isArray(symbols)) {
        logger.error(`BinanceWsClient:_subscribeOrderbookQueueHandler -> Expected array, received ${typeof symbols}`);

        return;
      }

      this.id += 1;

      const data = {
        method: 'SUBSCRIBE',
        params: [],
        id: Date.now() + this.id,
      };

      for (const symbol of symbols) {
        data.params.push(`${symbol}@depth`);
      }

      const dataString = JSON.stringify(data);

      logger.info('Send SUBSCRIBE message:', dataString);

      this.ws.send(dataString, () => resolve());
    });
  }

  /**
   * Run queue handler by timeout
   */
  addEventQueueHandler() {
    this.subscribeQueueTimer = setTimeout(
      async () => {
        await this._queueHandler();
        this.subscribeQueueTimer = setTimeout(() => this.addEventQueueHandler(), QUEUE_TIMEOUT_MS);
      },
      QUEUE_TIMEOUT_MS,
    );
  }

  /**
   * Events queue handler
   *
   * @returns {Promise<void>}
   */
  async _queueHandler() {
    if (this.subscribeQueue.length) {
      const symbolsSubscribeArray = this.subscribeQueue.splice(0, BINANCE_MAX_SYMBOLS_SUBSCRIPTIONS_COUNT);

      try {
        await this._subscribeOrderbookQueueHandler(symbolsSubscribeArray);
        await timeout(QUEUE_TIMEOUT_MS);
      } catch (e) {
        logger.error(`BinanceWsClient:_subscribeQueueHandler -> Got error ${e.message} while handle event ${JSON.stringify(symbolsSubscribeArray)}`);
      }
    }

    if (this.unsubscribeQueue.length) {
      const symbolsUnsubscribeArray = this.unsubscribeQueue.splice(0, BINANCE_MAX_SYMBOLS_SUBSCRIPTIONS_COUNT);

      try {
        await this._unsubscribeOrderbookQueueHandler(symbolsUnsubscribeArray);
        await timeout(QUEUE_TIMEOUT_MS);
      } catch (e) {
        logger.error(`BinanceWsClient:_unsubscribeQueueHandler -> Got error ${e.message} while handle event ${JSON.stringify(symbolsUnsubscribeArray)}`);
      }
    }
  }

  /**
   * Send unsubscribe message to WSS orderbook channel
   *
   * @param {string} symbol - Symbol
   * @returns {Promise<void|undefined|boolean>}
   */
  async unsubscribeOrderbook(symbol) {
    if (this.subscribeQueue.includes(symbol)) {
      this.subscribeQueue.splice(this.subscribeQueue.indexOf(symbol), 1);
      logger.info(`Try to unsubscribe symbols ${symbol} that is in subscribeQueue`);
    }

    !this.unsubscribeQueue.includes(symbol)
      ? this.unsubscribeQueue.push(symbol)
      : logger.info(`Try to unsubscribe symbols ${symbol} that is already in unsubscribeQueue`);
  }

  async _unsubscribeOrderbookQueueHandler(symbols) {
    return new Promise((resolve) => {
      if (!this.ws) {
        logger.error(connectionError.message);
        this.eventManager.restart(connectionError);

        return;
      }

      if (!Array.isArray(symbols)) {
        logger.error(`BinanceWsClient:_unsubscribeOrderbookQueueHandler -> Expected array, received ${typeof symbols}`);

        return;
      }

      this.id += 1;

      const data = {
        method: 'UNSUBSCRIBE',
        params: [],
        id: Date.now() + this.id,
      };

      for (const symbol of symbols) {
        data.params.push(`${symbol}@depth`);
      }

      const dataString = JSON.stringify(data);

      logger.debug('Send UNSUBSCRIBE message:', dataString);

      this.ws.send(dataString, () => resolve());
    });
  }
}

module.exports = BinanceWsClient;
