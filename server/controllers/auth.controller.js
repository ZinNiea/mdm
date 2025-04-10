// server/controllers/auth.controller.js
const { Request, Response } = require('express');
const { sendSMS } = require('../services/sms.service');
const bcrypt = require('bcrypt');
const { User } = require('../models/user.model');
const { Profile } = require('../models/profile.model');
const SECRET_KEY = process.env.SECRET_KEY;

const redisService = require('../services/redis.service');

/**
 * 인증번호 요청 처리
 * @param {Request} req - Express Request 객체
 * @param {Response} res - Express Response 객체
 * @param {Object} req.body - 요청 본문
 * @param {string} req.body.phoneNumber - 사용자 전화번호
 * @returns {Promise<void>} 응답 객체를 반환
 * @description 사용자가 제공한 전화번호로 6자리 인증번호를 생성하고 SMS로 발송
 */
const requestVerificationCode = async (req, res) => {
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
 * 인증번호 검증 처리
 * @param {Request} req - Express Request 객체
 * @param {Response} res - Express Response 객체
 * @param {Object} req.body - 요청 본문
 * @param {string} req.body.phoneNumber - 사용자 전화번호
 * @param {string} req.body.verificationCode - 사용자가 입력한 6자리 인증번호
 * @returns {Promise<void>} 응답 객체를 반환
 * @description 사용자가 입력한 인증번호와 저장된 인증번호를 비교하여 검증
 */
const verifyCode = async (req, res) => {
  const { phoneNumber, verificationCode } = req.body;

  // 입력값 검증
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return res.status(400).json({ result: false, message: '유효한 전화번호가 필요합니다.' });
  }

  if (!verificationCode || !/^\d{6}$/.test(verificationCode)) {
    return res.status(400).json({ result: false, message: '유효한 인증번호가 필요합니다.' });
  }

  // 저장된 인증번호를 가져와서 비교
  const storedCode = redisService.getVerificationCode(phoneNumber);

  if (storedCode === verificationCode) {
    res.status(200).json({ result: true, message: '인증에 성공했습니다.' });
  } else {
    res.status(400).json({ result: false, message: '인증번호가 일치하지 않습니다.' });
  }
};

/**
 * 사용자 로그인 처리
 * @param {Request} req - Express Request 객체
 * @param {Response} res - Express Response 객체
 * @param {Object} req.body - 요청 본문
 * @param {string} req.body.username - 사용자 아이디
 * @param {string} req.body.password - 사용자 비밀번호
 * @returns {Promise<void>} 응답 객체를 반환
 * @description 사용자 인증 후 JWT 토큰과 사용자 정보를 반환
 */
const login = async (req, res) => {
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

const register = async (req, res) => {
  const { username, password, email, nickname, phoneNumber } = req.body;
  // 업로드된 이미지의 URL 가져오기
  const profileImage = req.file ? req.file.location : null;
  const createdAt = new Date();

  // 허용할 도메인 목록
  const allowedDomains = ['naver.com', 'kakao.com', 'nate.com'];

  // 허용할 특수문자 지정
  const allowedSpecialChars = '!@#$%^&*';

  // 정규표현식 생성
  const passwordRegex = new RegExp(
    `^(?=.*[A-Za-z])(?=.*\\d)(?=.*[${allowedSpecialChars}])[A-Za-z\\d${allowedSpecialChars}]{4,20}$`
  );

  // 비밀번호 유효성 검사
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      result: false,
      message: `비밀번호는 최소 4자 이상, 영문 대소문자, 숫자, 특수문자(${allowedSpecialChars.split('').join('')})를 각각 최소 하나 이상 포함해야 합니다.`
    });
  }

  try {
    // 이메일 도메인 추출
    const emailDomain = email.split('@')[1].toLowerCase();

    // 사용자 이름 중복 검사
    if (await isUsernameTaken(username)) {
      return res.status(400).json({
        result: false,
        message: '이미 사용 중인 사용자 이름입니다.'
      });
    }

    // 이메일 중복 검사
    if (await isEmailTaken(email)) {
      return res.status(400).json({
        result: false,
        message: '이미 사용 중인 이메일입니다.'
      });
    }

    if (await isNicknameTaken(nickname)) {
      return res.status(400).json({
        result: false,
        message: '이미 사용 중인 닉네임입니다.'
      });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 프로필 생성

    // 삼항 연산자 사용해서, profileImage 있으면 profileImage 넣고, 없으면 profileImage 넣지 않는다.
    const newProfile = profileImage
      ? new Profile({
        nickname: nickname,
        profileImage: profileImage,
      })
      : new Profile({
        nickname: nickname,
      });

    await newProfile.save();

    // 사용자 생성
    const newUser = new User({
      username: username,
      email: email,
      password: hashedPassword,
      phoneNumber: phoneNumber,
      createdAt: createdAt,
      profiles: [newProfile._id],
      mainProfile: newProfile._id,
    });

    await newUser.save();

    res.status(201).json({
      result: true,
      message: '회원가입에 성공했습니다.'
    });
  } catch (err) {
    if (err.code === 11000) {
      const duplicatedField = Object.keys(err.keyValue)[0];
      res.status(400).json({
        result: false,
        message: `${duplicatedField}이 이미 사용 중입니다.`
      });
    } else if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      res.status(400).json({
        result: false,
        message: messages.join(', ')
      });
    } else {
      res.status(500).json({
        result: false,
        message: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      });
    }
  }
}

module.exports = {
  requestVerificationCode,
  verifyCode,
  login,
  register,
}