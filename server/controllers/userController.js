// server/user/userController.js
require('dotenv').config();
const { User } = require('../models/userModel');
const { Profile } = require('../models/profileModel');

// jwt 모듈을 사용하여 토큰을 발급합니다.
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

// bcrypt 모듈을 사용하여 비밀번호를 해싱합니다.
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

// 중복을 확인하는 유틸리티 함수를 가져옵니다.
const { isUsernameTaken, isEmailTaken } = require('../utils/userUtils');

// 회원가입 기능
exports.registerUser = async (req, res) => {
  const { username, password, email, age, nickname } = req.body;
  // 업로드된 이미지의 URL 가져오기
  const profileImage = req.file ? req.file.location : null;
  const createdAt = new Date();

  // 허용할 도메인 목록
  const allowedDomains = ['naver.com', 'kakao.com', 'nate.com'];

  // 허용할 특수문자 지정
  const allowedSpecialChars = '!@#$%^&*';

  // 정규표현식 생성
  const passwordRegex = new RegExp(
    `^(?=.*[A-Za-z])(?=.*\\d)(?=.*[${allowedSpecialChars}])[A-Za-z\\d${allowedSpecialChars}]{8,20}$`
  );

  // 비밀번호 유효성 검사
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      result: false,
      message: `비밀번호는 최소 8자 이상, 영문 대소문자, 숫자, 특수문자(${allowedSpecialChars.split('').join('')})를 각각 최소 하나 이상 포함해야 합니다.`
    });
  }

  try {
    // 이메일 도메인 추출
    const emailDomain = email.split('@')[1].toLowerCase();

    // 도메인 유효성 검사
    if (!allowedDomains.includes(emailDomain)) {
      return res.status(400).json({ 
        result: false, 
        message: '허용되지 않은 이메일 도메인입니다. naver.com, kakao.com, nate.com 도메인만 허용됩니다.' 
      });
    }

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

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 프로필 생성
  
    // 삼항 연산자 사용해서, profileImage 있으면 profileImage 넣고, 없으면 profileImage 넣지 않는다.
    const newProfile = profileImage
      ? new Profile({
          nickname: nickname,
          profileImage: profileImage,
          birthdate: age, // age가 birthdate라면 적절히 변환 필요
        })
      : new Profile({
          nickname: nickname,
          birthdate: age, // age가 birthdate라면 적절히 변환 필요
        });

    await newProfile.save();

    // 사용자 생성
    const newUser = new User({
      username: username, 
      email: email, 
      password: hashedPassword, 
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
};

// 사용자 이름 중복 검사 API
exports.checkUsername = async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({
      result: false,
      message: 'username이 필요합니다.'
    });
  }

  try {
    if (await isUsernameTaken(username)) {
      return res.status(200).json({
        result: false,
        message: '이미 사용 중인 사용자 이름입니다.'
      });
    } else {
      return res.status(200).json({
        result: true,
        message: '사용 가능한 사용자 이름입니다.'
      });
    }
  } catch (err) {
    res.status(500).json({
      result: false,
      message: err.message
    });
  }
};

// 이메일 중복 검사 API
exports.checkEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      result: false,
      message: '이메일이 필요합니다.'
    });
  }

  try {
    if (await isEmailTaken(email)) {
      return res.status(200).json({
        result: false,
        message: '이미 사용 중인 이메일입니다.'
      });
    } else {
      return res.status(200).json({
        result: true,
        message: '사용 가능한 이메일입니다.'
      });
    }
  } catch (err) {
    res.status(500).json({
      result: false,
      message: err.message
    });
  }
};

// 로그인 기능
exports.login = async (req, res) => {
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
      { expiresIn: '1d' }
    );

    // 프로필 목록 구성
    const profiles = user.profiles.map(profile => ({
      id: profile._id,
      nickname: profile.nickname,
      profileImage: profile.profileImage,
      birthdate: profile.birthdate,
      // 필요한 다른 필드 추가
    }));

    res.status(200).json({ 
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
};

// 회원 탈퇴 (소프트 삭제)
exports.deleteUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    if (!userId) {
      return res.status(400).json({ result: false, message: 'userId가 필요합니다.' });
    }

    const user = await User.findOneAndUpdate(
      { userId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() }
    );
    if (!user) {
      return res.status(404).json({ result: false, message: '사용자를 찾을 수 없습니다.' });
    }

    res.status(200).json({ 
      result: true,
      message: '사용자 계정이 성공적으로 삭제되었습니다.' 
    });
  } catch (err) {
    res.status(500).json({ 
      result: false,
      message: err.message 
    });
  }
};

// 유저의 프로필을 추가하는 함수
exports.addProfile = async (req, res) => {
  const userId = req.params.userId; // URL 파라미터에서 유저 ID 추출
  const { nickname, profileImage, birthdate, phone_number, phone_verified } = req.body;

  try {
    // 유저 찾기
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ result: false, message: '유저를 찾을 수 없습니다.' });
    }

    // 현재 프로필 수 확인
    if (user.profiles.length >= 5) {
      return res.status(400).json({ result: false, message: '프로필은 최대 5개까지 추가할 수 있습니다.' });
    }

    // 새 프로필 객체 생성
    const newProfile = {
      nickname,
      profileImage,
      birthdate,
      phone_number,
      phone_verified,
    };

    // 프로필 추가
    user.profiles.push(newProfile);

    // 유저 저장
    await user.save();

    res.status(200).json({ result: true, message: '프로필이 성공적으로 추가되었습니다.', data: newProfile });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
};

// mainCategory에 따른 모든 subCategory 조회
exports.getSubCategories = async (req, res) => {
  const { mainCategory } = req.params;
  try {
    const profiles = await Profile.find({ 'interests.mainCategory': mainCategory });
    const subCategoriesSet = new Set();
    profiles.forEach(profile => {
      profile.interests.forEach(interest => {
        if (interest.mainCategory === mainCategory) {
          subCategoriesSet.add(interest.subCategory);
        }
      });
    });
    res.status(200).json({ subCategories: Array.from(subCategoriesSet) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};