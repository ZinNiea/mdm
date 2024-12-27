// models/chatModel.js
const mongoose = require('mongoose');
const { MODELS, CHAT_CATEGORY } = require('./constants'); // 상수 불러오기

const participantSchema = new mongoose.Schema({
  profile: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE, required: true },
  lastReadTimestamp: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: true });

const chatSchema = new mongoose.Schema({
  participants: [participantSchema],
  auctionItem: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.AUCTIONITEM },
  category: { type: String, enum: Object.values(CHAT_CATEGORY), required: true }, // 상수 사용
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
});

// category에 따른 auctionItem 필수 여부 검증 추가
chatSchema.pre('save', function(next) {
  if (this.category === CHAT_CATEGORY.AUCTION && !this.auctionItem) {
    return next(new Error('거래 채팅방은 auctionItem 필드가 필요합니다.'));
  }
  next();
});

const Chat = mongoose.model(MODELS.CHAT, chatSchema);
module.exports = { Chat };