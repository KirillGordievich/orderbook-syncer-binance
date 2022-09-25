const logger = require('../utils/logger');
const ApiClient = require('../binance/api-client/index');
const WsClient = require('./ws-client');
const eventManager = require('../syncer/utils/app-event-manager');
const timeout = require('../utils/timeout');
const FIAT_COINS = require('../utils/fiat_coins');
const buildRedisClient = require('../redis/client-builder');

const EVENT_QUEUE_TIMEOUT_MS = 10000;

class BinanceClient {
  constructor(config) {
    this.type = 'binance';
    this.config = config;
    this.apiClient = new ApiClient(config);
    this.redisClient = null;
    this.wsClient = null;

    // queues
    this.eventsQueue = [];

    // cached data
    this.symbolsDataCache = new Map();

    // monitoring
    this.processedEventsCount = 0;
    this.eventsCount = 0;
  }

  /**
   * Init synchronization orderbooks data
   *
   * @returns {Promise<void>}
   */
  async initOrderbooksSync() {
    try {
      await this.initRedisClient();
      await this._initWebsocketClient();

      logger.info('Try to get symbols to init sync by Stock Api.');

      const tickers = await this.apiClient.getAllTickers();

      const symbols = tickers
        .filter((it) => it.status === 'TRADING')
        .filter(this._onlyBtcTickersFilter)
        .filter(this._fiatCoinsFilter)
        .map((it) => it.symbol);

      logger.info(`Got ${symbols.length} symbols from Stock Api to init sync.`);

      this._saveSymbolsMappingToCache(tickers); // without this _convertSymbol won't work!

      this.addEventQueueHandler();

      logger.info('Start sync orderbook data');

      for (const symbol of symbols) {
        await this.wsClient.subscribeOrderbook(symbol.toLowerCase());
      }
    } catch (e) {
      e.message = `BinanceClient:initOrderbooksSync() -> ${e.message}`;

      throw new Error(e);
    }
  }

  async stopOrderbooksSync() {
    try {
      logger.info('Stop sync orderbook data');
      // todo: complete this method
    } catch (e) {
      e.message = `BinanceClient:stopOrderbooksSync() -> ${e.message}`;

      throw new Error(e);
    }
  }

  async _initWebsocketClient() {
    try {
      this.wsClient = new WsClient(eventManager);
      await this.wsClient.initSocket(`${this.config.wsUrl}/stream`, this._messageHandler.bind(this));
    } catch (e) {
      e.message = `BinanceClient:initWebsocketClient() -> Got error while init websocket client: ${e.message}`;

      throw new Error(e);
    }
  }

  async initRedisClient() {
    this.redisClient = await buildRedisClient();
  }

  _saveSymbolsMappingToCache(symbolsData) {
    try {
      symbolsData.forEach((it) => {
        if (
          typeof it.symbol !== 'string'
          || typeof it.baseAsset !== 'string'
          || typeof it.quoteAsset !== 'string'
        ) {
          throw new Error(`Wrong symbol data: ${JSON.stringify(it)}`);
        }

        const symbolName = it.symbol.toUpperCase();
        const baseCurrency = it.baseAsset.toUpperCase();
        const quoteCurrency = it.quoteAsset.toUpperCase();

        // Binance symbols don't have a separator between currencies, so we need to add it by ourself
        // for convenience we add it ourselves
        this.symbolsDataCache.set(symbolName, `${baseCurrency}-${quoteCurrency}`);
      });
    } catch (e) {
      e.message = `BinanceClient:_saveSymbolsMappingToCache() -> ${e.message}`;

      throw new Error(e);
    }
  }

  /**
   * Run queue handler by timeout
   */
  addEventQueueHandler() {
    this.queueTimer = setTimeout(
      async () => {
        await this._queueHandler();
        this.queueTimer = setTimeout(() => this.addEventQueueHandler(), EVENT_QUEUE_TIMEOUT_MS);
      },
      EVENT_QUEUE_TIMEOUT_MS,
    );
  }

  /**
   * Message event handler
   *
   * @param {string} msg
   */
  async _messageHandler(msg) {
    try {
      let data;

      try {
        data = JSON.parse(msg);
      } catch (e) {
        logger.error(e.message);
      }

      if (typeof data === 'undefined') {
        logger.error('Wrong message:', msg);

        return;
      }

      if (typeof data.msg === 'string') {
        logger.error('ERROR:', data.msg);

        return;
      }

      if (typeof data.data === 'undefined') {
        logger.debug('MESSAGE:', msg);

        return;
      }

      if (typeof data.data.s === 'string') {
        this.eventsQueue.push(data);
      }
    } catch (e) {
      e.message = `BinanceClient:_messageHandler() -> ${e.message}`;

      throw new Error(e);
    }
  }

  /**
   * Events queue handler
   *
   * @returns {Promise<void>}
   */
  async _queueHandler() {
    const eventDataArray = this.eventsQueue.splice(0, 10000);

    if (Array.isArray(eventDataArray)) {
      for (const eventData of eventDataArray) {
        try {
          await this._messageDataHandler(eventData);
          this.processedEventsCount += 1;
        } catch (e) {
          logger.error(`BinanceClient:_queueHandler -> Got error ${e.message} while handle event ${JSON.stringify(eventData)}`);
        }
      }
    }
  }

  /**
   * Message data handler
   *
   * @param {Object} data - Message data
   * @private
   */
  async _messageDataHandler(data) {
    try {
      const {
        s: symbolLower,
        U: sequenceStart,
        u: sequenceEnd,
        b: bids,
        a: asks,
      } = data.data;

      if (typeof symbolLower !== 'string') {
        return;
      }

      const symbol = symbolLower.toUpperCase();
      const convertedSymbol = this._convertSymbol(symbol);

      logger.info(`TOPIC "${symbol}" MESSAGE: ${JSON.stringify(data)}`);
    } catch (e) {
      e.message = `BinanceClient:_messageDataHandler() -> ${e.message}`;

      throw new Error(e);
    }
  }

  /**
   * Cover symbol to standard symbol view
   *
   * @param {string} inputSymbol - Symbol in stock view
   * @returns {string}
   * @private
   */
  _convertSymbol(inputSymbol) {
    try {
      return this.symbolsDataCache.get(inputSymbol.toUpperCase());
    } catch (e) {
      e.message = `BinanceClient:_convertSymbol() -> ${e.message}`;

      throw new Error(e);
    }
  }

  /**
   * Convert standard symbol view to stock symbol view
   *
   * @param {string} inputSymbol
   * @returns {string}
   * @private
   */
  _unconvertSymbol(inputSymbol) {
    try {
      return inputSymbol.split('-')
        .join('')
        .toLowerCase();
    } catch (e) {
      e.message = `BinanceClient:_unconvertSymbol() -> ${e.message}`;

      throw new Error(e);
    }
  }

  _onlyBtcTickersFilter(it) {
    return it.baseAsset.toUpperCase() === 'BTC' || it.quoteAsset.toUpperCase() === 'BTC';
  }

  _fiatCoinsFilter(it) {
    return !FIAT_COINS.includes(it.baseAsset.toUpperCase()) && !FIAT_COINS.includes(it.quoteAsset.toUpperCase());
  }
}

module.exports = BinanceClient;
