// middlewares/logging.js
const morgan = require('morgan');
const logger = require('../utils/logger'); // logger.js의 위치에 맞게 경로 수정

// Morgan과 Winston을 통합한 미들웨어 함수 생성
const loggingMiddleware = morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
});

module.exports = loggingMiddleware;
