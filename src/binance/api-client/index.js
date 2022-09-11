const axios = require('axios');

const BINANCE_API_REQUEST_TIMEOUT_MS = 30000;

axios.defaults.timeout = BINANCE_API_REQUEST_TIMEOUT_MS;

class BinanceApiClient {
  constructor(config) {
    if (!config.url) {
      throw new Error('Binance url must be specified');
    }

    this.baseUrl = config.url;
  }

  /**
   * Get stock tickers list
   *
   * @returns {Promise<*>}
   */
  async getAllTickers() {
    const result = await this.makePublicRequest('get', '/api/v3/exchangeInfo');

    return result.symbols;
  }

  /**
   * Get orderbook by symbol
   *
   * @param {string} symbol - Symbol
   * @param {string | number} limit - orderbook depth (number of price levels) to return
   * @returns {Promise<*>}
   */
  async getOrderBook(symbol, limit = 1000) {
    return this.makePublicRequest('get', `/api/v3/depth?symbol=${symbol}&limit=${limit}`);
  }

  /**
   * Create public request
   *
   * @param {string} method - Request method (GET, POST)
   * @param {path} path - Endpoint path
   * @param {Object} data - Request data
   * @returns {Promise<*>}
   */
  async makePublicRequest(method, path, data) {
    const config = {
      method,
      url: `${this.baseUrl}${path}`,
    };

    if (method === 'post') {
      if (!config.headers) {
        config.headers = {};
      }

      config.headers['Content-Type'] = 'application/json';
      config.data = data;
    }

    return this.makeRequest(config);
  }

  /**
   * Send request to stock API
   *
   * @param {Object} config - Request config
   * @returns {Promise<*>}
   */
  async makeRequest(config) {
    let res;

    try {
      const source = axios.CancelToken.source();

      setTimeout(() => {
        source.cancel();
      }, BINANCE_API_REQUEST_TIMEOUT_MS);

      const response = await axios(config, { cancelToken: source.token });

      res = response.data;
    } catch (e) {
      let message = `Binance API Error: ${e.message}`;

      if (e.response && e.response.data) {
        const errResData = e.response.data;

        message += errResData.msg ? `; ${errResData.msg}` : '';
        message += errResData.code ? `; Error code: ${errResData.code}` : '';
      }

      throw new Error(message);
    }

    if (!res) {
      throw new Error('Binance API Error: Invalid data');
    }

    return res;
  }
}

module.exports = BinanceApiClient;
