// redisClient.js
const redis = require('redis');

// // Redis 클라이언트 생성
// const client = redis.createClient({
//   url: 'redis://localhost:6379' // Redis 서버의 URL 및 포트
// });

// // 에러 핸들링
// client.on('error', (err) => {
//   console.error('Redis 클라이언트 오류:', err);
// });

// // Redis 서버에 연결
// client.connect()
//   .then(() => {
//     console.log('Redis에 성공적으로 연결되었습니다.');
//   })
//   .catch((err) => {
//     console.error('Redis 연결 오류:', err);
//   });

// module.exports = client;