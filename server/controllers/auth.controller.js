// server/controllers/auth.controller.js
const { Request, Response } = require('express');
const { sendSMS } = require('../services/sms.service');
const bcrypt = require('bcrypt');
const { User } = require('../models/user.model');
const SECRET_KEY = process.env.SECRET_KEY; // Load SECRET_KEY from environment variables
const { User } = require('../models/user.model');

/**
 * 인증번호 요청
 * @param {Request} req
 * @param {Response} res
 */
exports.requestVerificationCode = async (req, res) => {
  const { phoneNumber } = req.body;
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6자리 인증번호 생성

  try {
    // 인증번호와 유효기간을 저장 (Redis)
    await redisService.saveVerificationCode(phoneNumber, verificationCode);

    // SMS 발송
    await sendSMS(phoneNumber, `인증번호는 ${verificationCode}입니다.`);

    res.status(200).json({ result: true, message: '인증번호가 전송되었습니다.' });
  } catch (err) {
    res.status(500).json({ result: false, message: '인증번호 전송에 실패했습니다.', error: err.message });
  }
};

/**
 * 인증번호 검증
 * @param {Request} req
 * @param {Response} res
 */
exports.verifyCode = async (req, res) => {
  const { phoneNumber, verificationCode } = req.body;

  // 입력값 검증
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return res.status(400).json({ result: false, message: '유효한 전화번호가 필요합니다.' });
  }

  if (!verificationCode || !/^\d{6}$/.test(verificationCode)) {
    return res.status(400).json({ result: false, message: '유효한 인증번호가 필요합니다.' });
  }

  // 저장된 인증번호를 가져와서 비교
  const storedCode = await redisService.getVerificationCode(phoneNumber);

  if (storedCode === verificationCode) {
    res.status(200).json({ result: true, message: '인증에 성공했습니다.' });
  } else {
    res.status(400).json({ result: false, message: '인증번호가 일치하지 않습니다.' });
  }
};

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
async function login(req, res) {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username: username, isDeleted: false });

    // 사용자 존재 여부와 비밀번호 검증을 통합
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      SECRET_KEY,
      { expiresIn: '3d' }
    );
    // 프로필 목록 구성
    const profiles = Array.isArray(user.profiles) ? user.profiles.map(profile => ({
      id: profile._id,
      nickname: profile.nickname,
      profileImage: profile.profileImage,
      birthdate: profile.birthdate,
      // 필요한 다른 필드 추가
    })) : [];

    res.status(200).json({
      result: true,
      message: '로그인 성공',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        profiles: profiles,
      }
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
}

module.exports = {
  login,
}