const host =  process.env.REDIS_HOST || 'localhost';
const port = process.env.REDIS_PORT || 6379;
const db = process.env.REDIS_DB || 15;
const user = process.env.REDIS_USER || '';
const password = process.env.REDIS_PASSWORD || '';

// To connect to a different host or port use a connection string in the format:
// redis[s]://[[username][:password]@][host][:port][/db-number]:
const redisConfig = {
  url: `redis://${user}:${password}@${host}:${port}/${db}`,
}

module.exports = redisConfig;
