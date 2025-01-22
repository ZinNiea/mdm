// server/utils/errorHandler.js
const logger = require('./logger');

const handleError = (res, err) => {
  logger.error(err); // 에러 로그 기록
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
  }
  res.status(500).json({ success: false, message: err.message });
};

module.exports = handleError;