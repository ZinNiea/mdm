// server/services/smsService.js
const coolsms = require('coolsms-node-sdk').default;

// coolsms SDK 초기화
const sms = new coolsms('ENTER_YOUR_API_KEY', 'ENTER_YOUR_API_SECRET');
const from = '01012345678'; // 발신 번호

const sendSMS = async (to, message) => {
  try {
    const response = await sms.sendOne({
      to,
      from,
      text: message,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  sendSMS,
};