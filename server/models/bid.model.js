// server/models/bid.model.js
const mongoose = require('mongoose');
const { MODELS } = require('../constants/constants');

const BidSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  bidder: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.PROFILE },
  auctionItem: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.AUCTIONITEM },
  bidTime: { type: Date, default: Date.now }
});

const Bid = mongoose.model(MODELS.BID, BidSchema);
module.exports = { Bid };
