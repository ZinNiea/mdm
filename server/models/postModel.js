// server/models/postModel.js
const mongoose = require('mongoose');
const { MODELS } = require('./constants');

// 카테고리 상수 정의
const CATEGORY = {
  FRIENDS: 1,        // 친구에게 보이는 게시물
  CLOSE_FRIENDS: 2,  // 친한 친구에게만 보이는 게시물
  PUBLIC: 3           // 모든 사용자에게 공개되는 게시물 (추가 가능)
};

// 게시물 스키마 정의
const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE, required: true },
  content: { type: String, required: true },
  images: [{ type: String }],
  category: {
    type: Number,
    required: true,
    enum: Object.values(CATEGORY),
    default: CATEGORY.FRIENDS // 기본값 설정 (선택 사항)
  }, // 카테고리 필드 수정
  viewCount: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE }],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: MODELS.COMMENT }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 카테고리 상수를 모델에 추가하여 외부에서 접근 가능하��록 함
postSchema.statics.CATEGORY = CATEGORY;

const Post = mongoose.model(MODELS.POST, postSchema);
module.exports = { Post };