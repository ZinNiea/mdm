const mongoose = require('mongoose');
const { MODELS } = require('./constants');

const notificationSchema = new mongoose.Schema({
  profile: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE, required: true },
  category: { 
    type: String, 
    enum: ['거래', '커뮤니티', '동행'],
    required: true 
  },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model(MODELS.NOTIFICATION, notificationSchema);
module.exports = { Notification };