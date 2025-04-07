// server/middlewares/logging.js
const morgan = require('morgan');
const logger = require('../utils/logger'); // logger.js의 위치에 맞게 경로 수정

// 커스텀 포맷 정의 (타임스탬프 제외)
const customFormat = ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

// Morgan과 Winston을 통합한 미들웨어 함수 생성
const loggingMiddleware = morgan(customFormat, {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
});

module.exports = loggingMiddleware;
