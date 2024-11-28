// utils/userUtils.js

const User = require('../models/userModel');

// 사용자 이름 중복 검사 함수
exports.isUsernameTaken = async (username) => {
  return await User.findOne({ username });
};

// 이메일 중복 검사 함수
exports.isEmailTaken = async (email) => {
  return await User.findOne({ email });
};

// 닉네임 중복 검사 함수
