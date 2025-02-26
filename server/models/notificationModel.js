const mongoose = require('mongoose');
const { MODELS } = require('./constants');

const notificationSchema = new mongoose.Schema({
  profile: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE, required: true },
  category: {
    type: String,
    enum: ['거래', '커뮤니티'],
    required: true
  },
  message: { type: String, required: true },
  deepLink: { type: String, default: null }, // 추가: 딥링크 필드
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model(MODELS.NOTIFICATION, notificationSchema);
module.exports = { Notification };