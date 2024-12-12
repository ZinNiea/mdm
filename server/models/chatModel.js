// models/chatModel.js
const mongoose = require('mongoose');
const { MODELS, CHAT_CATEGORY } = require('./constants'); // 상수 불러오기

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE }],
  auctionItem: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.AUCTIONITEM },
  roomId: { type: String, required: true, unique: true },
  category: { type: String, enum: Object.values(CHAT_CATEGORY), required: true }, // 상수 사용
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE },
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
});

const Chat = mongoose.model(MODELS.CHAT, chatSchema);
module.exports = { Chat };