// server/routes/api/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');

/**
 * @swagger
 * /api/auth/request-verification-code:
 *   post:
 *     summary: 인증번호 요청
 *     description: 사용자 전화번호로 SMS 인증번호를 발송합니다.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: 사용자 전화번호
 *     responses:
 *       200:
 *         description: 인증번호 발송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: 서버 오류
 */
// 인증번호 발송 요청
router.post('/request-verification-code', authController.requestVerificationCode);

/**
 * @swagger
 * /api/auth/verify-code:
 *   post:
 *     summary: 인증번호 검증
 *     description: 사용자가 입력한 인증번호를 검증합니다.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - verificationCode
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: 사용자 전화번호
 *               verificationCode:
 *                 type: string
 *                 description: 사용자가 입력한 6자리 인증번호
 *     responses:
 *       200:
 *         description: 인증번호 검증 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: 잘못된 요청 또는 인증번호 불일치
 */
// 인증번호 확인 요청
router.post('/verify-code', authController.verifyCode);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 사용자 로그인
 *     description: 사용자 아이디와 비밀번호를 확인하고 JWT 토큰을 발급합니다.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 사용자 아이디
 *               password:
 *                 type: string
 *                 format: password
 *                 description: 사용자 비밀번호
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: JWT 인증 토큰
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     profiles:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.post('/login', authController.login);

router.post('/register', authController.register);

module.exports = router;