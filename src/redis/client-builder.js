const redis = require('redis');
const Redis = require('../redis/client');
const config = require('../config/redis');

let RedisClient;

async function buildRedisClient() {
  if (RedisClient) {
    return RedisClient;
  }

  const client = redis.createClient(config);
  await client.connect();

  RedisClient = new Redis(client)

  return RedisClient;
}

module.exports = buildRedisClient;
