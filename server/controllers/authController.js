// server/controllers/authController.js
const { sendSMS } = require('../services/smsService');
const crypto = require('crypto');

exports.requestVerificationCode = async (req, res) => {
  const { phoneNumber } = req.body;
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6자리 인증번호 생성

  // 인증번호와 유효기간을 저장 (예: Redis 또는 세션)
  await saveVerificationCode(phoneNumber, verificationCode);

  // SMS 발송
  const result = await sendSMS(phoneNumber, `인증번호는 ${verificationCode}입니다.`);

  if (result.success) {
    res.status(200).json({ result: true, message: '인증번호가 전송되었습니다.' });
  } else {
    res.status(500).json({ result: false, message: '인증번호 전송에 실패했습니다.' });
  }
};

exports.verifyCode = async (req, res) => {
  const { phoneNumber, verificationCode } = req.body;

  // 저장된 인증번호를 가져와서 비교
  const storedCode = await getStoredVerificationCode(phoneNumber);

  if (storedCode === verificationCode) {
    res.status(200).json({ result: true, message: '인증에 성공했습니다.' });
  } else {
    res.status(400).json({ result: false, message: '인증번호가 일치하지 않습니다.' });
  }
};