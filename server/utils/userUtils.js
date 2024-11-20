// utils/userUtils.js

const userSchema = require('../models/userModel');

// 사용자 이름 중복 검사 함수
exports.isUsernameTaken = async (username) => {
  return await userSchema.findOne({ username });
};

// 이메일 중복 검사 함수
exports.isEmailTaken = async (email) => {
  return await userSchema.findOne({ email });
};

// 닉네임 중복 검사 함수
