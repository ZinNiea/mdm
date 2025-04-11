// #swagger.tags = ['Authentication']
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 인증번호 발송 요청
router.post('/request-verification-code', authController.requestVerificationCode);

// 인증번호 확인 요청
router.post('/verify-code', authController.verifyCode);

module.exports = router;