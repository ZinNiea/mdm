// models/auctionItem.js
const mongoose = require('mongoose');
const { MODELS } = require('./constants');

const AuctionItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: {
    type: String,
    enum: ['거래', '나눔', '과테말라'],
    required: true,
  },
  startingPrice: { type: Number, required: true },
  instantBuyPrice: Number,
  currentBid: { type: Number, default: 0 },
  highestBidder: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE },
  endTime: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE, required: true },
  images: [{ type: String }],
  related: { type: String },  // 관련 인물 또는 작품
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE }],
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

const AuctionItem = mongoose.model(MODELS.AUCTIONITEM, AuctionItemSchema);
module.exports = { AuctionItem };
