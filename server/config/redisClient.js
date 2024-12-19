
const redis = require('redis');

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  // 추가 설정이 필요한 경우 여기에 작성
});

redisClient.on('error', (err) => {
  console.error('Redis 오류:', err);
});

module.exports = redisClient;