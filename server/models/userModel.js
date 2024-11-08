// server/user/userModel.js
const mongoose = require('mongoose');

// 사용자 스키마 정의
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  birthdate: {
    type: Date,
  },
  nickname: {
    type: String,
  },
  userImage: {
    type: String
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
}, { timestamps: true });

// 사용자 모델 생성
module.exports = mongoose.model('User', userSchema);