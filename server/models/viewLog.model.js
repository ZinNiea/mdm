// server/models/viewLog.model.js
const mongoose = require('mongoose');
const { MODELS } = require('../constants/constants');

const viewLogSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.POST, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
});

const ViewLog = mongoose.model(MODELS.VIEWLOG, viewLogSchema);
module.exports = { ViewLog };