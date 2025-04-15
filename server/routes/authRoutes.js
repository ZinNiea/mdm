// #swagger.tags = ['Authentication']
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 인증번호 발송 요청
// #swagger.description = '인증번호 발송 요청'
// #swagger.responses[200] = { description: '인증번호 발송 성공' }
// #swagger.responses[500] = { description: '인증번호 발송 실패' }
router.post('/request-verification-code', authController.requestVerificationCode);

// 인증번호 확인 요청
router.post('/verify-code', authController.verifyCode);

router.post('/register', upload(IMAGE_TYPES.PROFILE).single('profileImage'), authController.registerUser);

router.post('/login', authController.login);

router.post('/logout', authController.logout);

module.exports = router;