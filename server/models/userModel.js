// server/user/userModel.js
const mongoose = require('mongoose');

// 사용자 스키마 정의
const userSchema = new mongoose.Schema({
  userName: {
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
    age: {
      type: Number,
    },
    nickname: {
      type: String,
    },
    userImage: {
      type: String
    },
  }, { timestamps: true });

// 사용자 모델 생성
module.exports = mongoose.model('User', userSchema);