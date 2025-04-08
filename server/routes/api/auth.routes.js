// server/routes/api/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');

// 인증번호 발송 요청
router.post('/request-verification-code', authController.requestVerificationCode);

// 인증번호 확인 요청
router.post('/verify-code', authController.verifyCode);

router.post('/login', authController.login);

router.post('/register', authController.register);

module.exports = router;