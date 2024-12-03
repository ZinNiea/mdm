// models/Report.js
const mongoose = require('mongoose');
const MODELS = require('./constants');

const ReportSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODELS.POST,
    required: true,
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: MODELS.PROFILE,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  reportedAt: {
    type: Date,
    default: Date.now,
  },
});

const Report = mongoose.model(MODELS.REPORT, ReportSchema);
module.exports = { Report };