// logger.js
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info', // 로그 레벨 설정
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // 타임스탬프 형식 지정
    format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`)
  ),
  transports: [
    new transports.Console(), // 콘솔에 로그 출력
    new transports.File({ filename: 'logs/app.log' }), // 파일에 로그 저장
  ],
});

module.exports = logger;
