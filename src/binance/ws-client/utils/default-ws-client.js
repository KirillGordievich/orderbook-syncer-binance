const WebSocket = require('ws');
const logger = require('../../../utils/logger');

const connectionError = new Error('No opened websocket connection');

class DefaultWebsocketClient {
  constructor(eventManager) {
    this.ws = null;
    this.eventManager = eventManager;
  }

  /**
   * Init socket connection
   *
   * @param {string} wsUrl - Websocket URL
   * @param {function} messageHandler - Socket messages handler
   * @returns {Promise<void>}
   */
  async initSocket(wsUrl, messageHandler) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        logger.info('Websocket connection opened...');
        this.ws.heartbeat = setInterval(this.socketHeartBeat.bind(this), 20000);

        resolve(this.ws);
      });

      this.ws.on('ping', (data) => {
        logger.debug('Server ping', Buffer.from(data).toString());
        this.ws.pong();
      });

      this.ws.on('pong', (data) => {
        logger.debug('Server pong', Buffer.from(data).toString());
      });

      this.ws.on('close', (closeEventCode, reason) => {
        clearInterval(this.ws.heartbeat);
        this.ws = null;
        logger.info(`Connection close due to ${closeEventCode}: ${reason}.`);
        this.eventManager.restart(new Error(`Websocket connection closed due to ${closeEventCode}: ${reason}`));
      });

      this.ws.on('error', (error) => {
        this.socketErrorHandler(error);

        reject(error);
      });

      this.ws.on('message', (msg) => {
        messageHandler(msg);
      });
    });
  }

  /**
   * Close socket connection
   */
  closeSocket() {
    if (this.ws) {
      this.ws.close();
    }
  }

  /**
   * Error handler
   *
   * @param error
   */
  socketErrorHandler(error) {
    let errorMessage = 'WebSocket error:';

    errorMessage += `${error.code ? ` (${error.code})` : ''}`;
    errorMessage += `${error.message ? ` (${error.message})` : ''}`;
    logger.error(errorMessage);
  }

  /**
   * Heartbeat ping to WSS
   */
  socketHeartBeat() {
    this.ws.ping();
  }

  /**
   * Send message to stock wss
   *
   * @param {Object} data - Data for send to stock
   * @param {string} logMessage - Message for logging
   * @param {string} logLevel - Log level (info|debug)
   * @returns {Promise<void>}
   */
  async sendMessage(data, logMessage, logLevel) {
    return new Promise((resolve) => {
      if (!this.ws) {
        logger.error(connectionError.message);
        this.eventManager.restart(connectionError);

        return;
      }

      const dataString = JSON.stringify(data);

      logger[logLevel](logMessage, dataString);

      this.ws.send(dataString, () => resolve());
    });
  }
}

module.exports = DefaultWebsocketClient;
