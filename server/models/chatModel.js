// models/chatModel.js
const mongoose = require('mongoose');
const { MODELS, CHAT_CATEGORY } = require('./constants'); // 상수 불러오기

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE }],
  auctionItem: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.AUCTIONITEM },
  // roomId 필드 제거
  category: { type: String, enum: Object.values(CHAT_CATEGORY), required: true }, // 상수 사용
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
});

const Chat = mongoose.model(MODELS.CHAT, chatSchema);
module.exports = { Chat };