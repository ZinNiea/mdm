// server/user/userController.js
require('dotenv').config();
const userSchema = require('../models/userModel');

// jwt 모듈을 사용하여 토큰을 발급합니다.
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

// bcrypt 모듈을 사용하여 비밀번호를 해싱합니다.
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

// 회원가입 기능
exports.registerUser = async (req, res) => {
  const { username, password, email, age, nickname, userImage } = req.body;
  const createdAt = new Date();
  
  // 허용할 도메인 목록
  const allowedDomains = ['naver.com', 'kakao.com', 'nate.com'];

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
    const existingUserName = await userSchema.findOne({ username });
    if (existingUserName) {
      return res.status(400).json({ 
        result: false, 
        message: '이미 사용 중인 사용자 이름입니다.' 
      });
    }

    // 이메일 중복 검사
    const existingEmail = await userSchema.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ 
        result: false, 
        message: '이미 사용 중인 이메일입니다.' 
      });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 사용자 생성
    await userSchema.create({ 
      username, 
      email, 
      password: hashedPassword, 
      birthdate: age, 
      nickname, 
      userImage, 
      createdAt 
    });

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

// 로그인 기능
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await userSchema.findOne({ username, isDeleted: false });

    if (!user) {
      return res.status(401).json({ message: '유저를 찾을 수 없습니다.' });
    }

    // 비밀번호 검증
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.status(200).json({ 
      message: '로그인 성공', 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
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
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ result: false, message: 'username이 필요합니다.' });
    }

    const user = await userSchema.findOneAndUpdate(
      { username, isDeleted: false },
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