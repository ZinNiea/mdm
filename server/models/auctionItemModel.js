// models/auctionItem.js
const mongoose = require('mongoose');
const MODELS = require('./constants');

const AuctionItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: {
    type: String,
    enum: ['거래', '나눔', '이벤트'],
    required: true,
  },
  startingPrice: { type: Number, required: true },
  instantBuyPrice: Number,
  currentBid: { type: Number, default: 0 },
  highestBidder: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.USER },
  endTime: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.USER, required: true },
  images: [{ type: String }],
  realted: { type: String },  // 관련 인물 또는 작품
});

const AuctionItem = mongoose.model(MODELS.AUCTIONITEM, AuctionItemSchema);
module.exports = { AuctionItem };
