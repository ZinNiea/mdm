// profileModel.js
const mongoose = require('mongoose');
const { MODELS } = require('./constants');

const interestSchema = new mongoose.Schema({
  mainCategory: { type: String, required: true },
  subCategory: { type: String, required: true },
  bias: { type: String }
});

const profileSchema = new mongoose.Schema({
  nickname: {
    type: String,
    unique: true,
    required: true,
  },
  profileImage: {
    type: String,
  },
  birthdate: {
    type: Date,
  },
  gender: {
    type: String,
  },
  mbti: {
    type: String,
  },
  introduction: {
    type: String,
  },
  likeWork : {
    type: String,
  },
  likeSong : {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  rating: { // 매너 평가점수
    type: Number,
    default: 0,
  },
  // 추가로 필요한 프로필 정보를 여기에 추가합니다.
  interests: {
    type: [interestSchema],
    validate: [interestsLimit, '최대 5개의 관심사만 가질 수 있습니다.']
  },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE }],
  topFriends: [{ type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE }],
  blockedProfiles: [{ type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE }], // 차단된 프로필
  hiddenProfiles: [{ type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE }], // 숨겨진 프로필
});

function interestsLimit(val) {
  return val.length <= 5;
}

const Profile = mongoose.model(MODELS.PROFILE, profileSchema);
module.exports = { Profile };