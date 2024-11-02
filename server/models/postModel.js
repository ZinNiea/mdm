// server/user/postModel.js
const mongoose = require('mongoose');

// 카테고리 상수 정의
const CATEGORY = {
  FRIENDS: 1,        // 친구에게 보이는 게시물
  CLOSE_FRIENDS: 2,  // 친한 친구에게만 보이는 게시물
  PUBLIC: 3           // 모든 사용자에게 공개되는 게시물 (추가 가능)
};

// 댓글 스키마 정의
const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// 게시물 스키마 정의
const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  images: [{ type: String }],
  category: { 
    type: Number, 
    required: true,
    enum: Object.values(CATEGORY),
    default: CATEGORY.FRIENDS // 기본값 설정 (선택 사항)
  }, // 카테고리 필드 수정
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// 카테고리 상수를 모델에 추가하여 외부에서 접근 가능하도록 함
postSchema.statics.CATEGORY = CATEGORY;

module.exports = mongoose.model('Post', postSchema);