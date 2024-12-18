// server/services/smsService.js
const { MessageService } = require('@coolsms/node-sdk');

// coolsms SDK 초기화
const messageService = new MessageService(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);

/**
 * SMS 발송 함수
 * @param {string} to - 수신자 전화번호
 * @param {string} message - 발송할 메시지 내용
 * @returns {Promise<object>} - 발송 결과
 */
const sendSMS = async (to, message) => {
  try {
    await messageService.sendOne({
      to,
      from: process.env.SENDER_PHONE_NUMBER, // 발신자 번호
      text: message,
    });
    return { success: true };
  } catch (error) {
    console.error('SMS 발송 오류:', error);
    return { success: false, error };
  }
};

module.exports = { sendSMS };