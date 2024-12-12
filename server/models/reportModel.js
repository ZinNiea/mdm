// models/Report.js
const mongoose = require('mongoose');
const { MODELS } = require('./constants');

const ReportSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODELS.POST,
    required: true,
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODELS.PROFILE,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  reportedAt: {
    type: Date,
    default: Date.now,
  },
});

const commentReportSchema = new mongoose.Schema({
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODELS.COMMENT,
    required: true,
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODELS.PROFILE,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['스팸', '욕설', '혐오', '기타'], // 예시 카테고리
  },
  content: {
    type: String,
    required: true,
  },
  reportedAt: {
    type: Date,
    default: Date.now,
  },
});

const ProfileReportSchema = new mongoose.Schema({
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODELS.PROFILE,
    required: true,
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODELS.PROFILE,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  reportedAt: {
    type: Date,
    default: Date.now,
  },
});

const Report = mongoose.model(MODELS.REPORT, ReportSchema);
const CommentReport = mongoose.model(MODELS.COMMENTREPORT, commentReportSchema);
const ProfileReport = mongoose.model(MODELS.PROFILEREPORT, ProfileReportSchema);

module.exports = { Report, CommentReport, ProfileReport };