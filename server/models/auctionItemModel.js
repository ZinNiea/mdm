// models/auctionItem.js
const mongoose = require('mongoose');
const MODELS = require('./constants');

const AuctionItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  startingPrice: { type: Number, required: true },
  instantBuyPrice: Number,
  currentBid: { type: Number, default: 0 },
  highestBidder: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.USER },
  endTime: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.USER, required: true },
});

const AuctionItem = mongoose.model(MODELS.AUCTIONITEM, AuctionItemSchema);
module.exports = { AuctionItem };
