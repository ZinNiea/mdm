// profileModel.js
const mongoose = require('mongoose');

const interestSchema = new mongoose.Schema({
  mainCategory: { type: String, required: true },
  subCategory: { type: String, required: true },
  bias: { type: String }
});

const profileSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
  },
  userImage: {
    type: String,
  },
  birthdate: {
    type: Date,
  },
  phoneNumber: {
    type: String,
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // 추가로 필요한 프로필 정보를 여기에 추가합니다.
  interests: {
    type: [interestSchema],
    validate: [interestsLimit, '최대 5개의 관심사만 가질 수 있습니다.']
  }
});

function interestsLimit(val) {
  return val.length <= 5;
}

const Profile = mongoose.model('Profile', profileSchema);
module.exports = { Profile };