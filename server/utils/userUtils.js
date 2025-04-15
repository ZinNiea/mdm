// utils/userUtils.js
const { User } = require('../models/userModel');
const { Profile } = require('../models/profileModel');

// 사용자 이름 중복 검사 함수
exports.isUsernameTaken = async (username) => {
  return await User.findOne({ username });
};

// 이메일 중복 검사 함수 수정: email과 domain을 별도로 받음
exports.isEmailTaken = async (email, domain) => {
  const fullEmail = `${email}@${domain}`;
  return await User.findOne({ email: fullEmail });
};

// 닉네임 중복 검사 함수
exports.isNicknameTaken = async (nickname) => {
  return await Profile.findOne({ nickname });
};