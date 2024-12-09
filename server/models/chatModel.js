// models/chatModel.js
const mongoose = require('mongoose');
const MODELS = require('./constants');

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: MODELS.USER }],
  auctionItem: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.AUCTIONITEM },
  roomId: { type: String, required: true, unique: true },
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.USER },
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
});

const Chat = mongoose.model(MODELS.CHAT, chatSchema);
module.exports = { Chat };