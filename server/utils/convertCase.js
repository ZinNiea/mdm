// utils/convertCase.js
const camelcaseKeys = require('camelcase-keys');
const snakecaseKeys = require('snakecase-keys');

/**
 * 입력 데이터를 camelCase로 변환합니다.
 * @param {Object} obj - 변환할 객체
 * @returns {Object} - camelCase로 변환된 객체
 */
const toCamelCase = (obj) => camelcaseKeys(obj, { deep: true });

/**
 * 응답 데이터를 snake_case로 변환합니다.
 * @param {Object} obj - 변환할 객체
 * @returns {Object} - snake_case로 변환된 객체
 */
const toSnakeCase = (obj) => snakecaseKeys(obj, { deep: true });

module.exports = {
  toCamelCase,
  toSnakeCase
};