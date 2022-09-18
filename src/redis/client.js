const TTL_S = 60; // 60 sec


class Redis {
  constructor(client) {
    this.client = client;
  }
  /**
   * Get stock symbol list key
   *
   * @param {string} stockType - Stock type
   * @returns {string}
   */
  getStockSymbolsKey(stockType) {
    return `${stockType}::symbols`;
  }

  /**
   * Add stock symbol to key
   *
   * @param {string} stockType - Stock type
   * @param {string} symbol - Symbol
   * @returns {Promise<number>}
   */
   async addSymbol(stockType, symbol) {
    return this.client.SADD(this.getStockSymbolsKey(stockType), symbol.toUpperCase());
  }

  /**
   * Get stock's symbols
   *
   * @param {string} stockType - Stock type
   * @returns {Promise<number>}
   */
  async getSymbol(stockType) {
    return this.client.SMEMBERS(this.getStockSymbolsKey(stockType));
  }
}

module.exports = Redis;
