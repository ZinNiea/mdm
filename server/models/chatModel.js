// models/chatModel.js
const mongoose = require('mongoose');
const { MODELS, CHAT_CATEGORY } = require('./constants'); // 상수 불러오기

//!< 메세지 스키마
const messageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.CHAT, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

//!< 채팅 스키마
const chatSchema = new mongoose.Schema({
  /*participants: [participantSchema],*/
  // participants: [{ type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE }],
  participants: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.PROFILE,
      required: true
    }],
  },
  auctionItem: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.AUCTIONITEM },
  category: { type: String, enum: Object.values(CHAT_CATEGORY), required: true }, // 상수 사용
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastMessage: {
    content: { type: String },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE },
    timestamp: { type: Date },
  },
});

// category에 따른 auctionItem 필수 여부 검증 추가
chatSchema.pre('save', function (next) {
  if (this.category === CHAT_CATEGORY.AUCTION && !this.auctionItem) {
    return next(new Error('거래 채팅방은 auctionItem 필드가 필요합니다.'));
  }
  next();
});

const Chat = mongoose.model(MODELS.CHAT, chatSchema);
const Message = mongoose.model(MODELS.MESSAGE, messageSchema);

module.exports = { Chat, Message };