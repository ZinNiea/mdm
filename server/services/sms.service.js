// services/sms.service.js
const coolsms = require('coolsms-node-sdk').default;

// coolsms SDK 초기화
const sms = new coolsms('NCSAEXVNH5UOIDCJ', 'CZTTVINLVNM2HHUJYVAKL32GNRWIAMGL');
const from = '01032442463'; // 발신 번호

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