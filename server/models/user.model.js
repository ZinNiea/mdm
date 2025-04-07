// server/models/user.model.js
const mongoose = require('mongoose');
const { Profile } = require('./profile.model');
const { MODELS } = require('../constants/constants');

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
  phoneNumber: {
    type: String,
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  // 가입일 필드 추가
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // 탈퇴 여부 필드 추가
  isDeleted: {
    type: Boolean,
    default: false,
    required: true,
  },

  // 프로필 필드 추가
  profiles: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: MODELS.PROFILE,
    validate: [arrayLimit, '최대 5개의 프로필만 가질 수 있습니다.'],
  },
  mainProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODELS.PROFILE,
  },
  resetPasswordCode: String,
  resetPasswordExpires: Date,
});

// 프로필 수 제한을 위한 유효성 검사 함수
function arrayLimit(val) {
  return !val || val.length <= 5;
}

// mainProfile이 profiles 배열에 포함되는지 확인
userSchema.pre('save', function (next) {
  if (this.mainProfile && !this.profiles.includes(this.mainProfile)) {
    return next(new Error('mainProfile must be one of the profiles'));
  }
  next();
});

const User = mongoose.model(MODELS.USER, userSchema);
module.exports = { User };