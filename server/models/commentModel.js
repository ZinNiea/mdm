// models/commentModel.js
const mongoose = require('mongoose');
const MODELS = require('./constants');

const commentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODELS.POST,
    required: true,
  },
  author: {
    type: String,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Comment = mongoose.model(MODELS.COMMENT, commentSchema);
module.exports = { Comment };