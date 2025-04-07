// server/services/redis.service.js
const redisClient = require('../config/redisClient');

const VERIFICATION_CODE_PREFIX = 'verification_code:';
const VERIFICATION_CODE_EXPIRY = 180; // 180초, 3분 (초 단위)

/**
 * 인증번호 저장
 * @param {string} phoneNumber - 전화번호
 * @param {string} code - 인증번호
 */
const saveVerificationCode = async (phoneNumber, code) => {
  const key = `${VERIFICATION_CODE_PREFIX}${phoneNumber}`;
  await redisClient.set(key, code, {
    EX: VERIFICATION_CODE_EXPIRY,
  });
};

/**
 * 인증번호 조회
 * @param {string} phoneNumber - 전화번호
 * @returns {string|null} - 저장된 인증번호 또는 null
 */
const getVerificationCode = async (phoneNumber) => {
  const key = `${VERIFICATION_CODE_PREFIX}${phoneNumber}`;
  const code = await redisClient.get(key);
  return code;
};

module.exports = {
  saveVerificationCode,
  getVerificationCode,
};