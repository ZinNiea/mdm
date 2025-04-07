// server/models/comment.model.js
const mongoose = require('mongoose');
const { MODELS } = require('../constants/constants');

const commentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODELS.POST,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODELS.PROFILE,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODELS.COMMENT,
    default: null, // 대댓글인 경우 부모 댓글의 ID, 아닐 경우 null
  },
  isDeleted: {
    type: Boolean,
    default: false, // 댓글 삭제 여부
  },
  likes: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE }],
    default: [], // 댓글 좋아요를 누른 사용자 ID 목록
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Comment = mongoose.model(MODELS.COMMENT, commentSchema);
module.exports = { Comment };