const timeout = require('../../utils/timeout');
const logger = require('../../utils/logger');

async function restart(syncOrderbooksService, error = null, eventManager) {
  if (error instanceof Error) {
    logger.error(error.message);
  }

  logger.error('Got restart signal. Try restart Orderbook syncer service.');

  try {
    await syncOrderbooksService.stopOrderbooksSync();
    await timeout(1000);
    await syncOrderbooksService.startOrderbooksSync();
    eventManager.resetRestarting();
  } catch (err) {
    eventManager.resetRestarting();
    eventManager.restart(err);
  }
}

async function stop(syncOrderbooksService, error = null) {
  if (error instanceof Error) {
    logger.error(error.message);
  }

  logger.error('Got terminate signal. Stop orderbooks sync.');

  await syncOrderbooksService.stopOrderbooksSync();
  await timeout(1000);

  process.exit(1);
}

async function run(syncOrderbooksService, eventManager) {
  eventManager.on('restart', async (error) => {
    // await restart(syncOrderbooksService, error, eventManager);
    // todo: restart or stop? ADD IS_RESTART_BY_PM2 to .env
    await stop(syncOrderbooksService, error);
  });

  eventManager.on('terminate', async (error) => {
    await stop(syncOrderbooksService, error);
  });

  try {
    await syncOrderbooksService.startOrderbooksSync();
  } catch (err) {
    logger.error('Start orderbook sync error', err.message);
    eventManager.resetRestarting();
    eventManager.restart(err);
  }
}

module.exports = run;
