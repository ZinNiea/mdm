// models/Report.js
const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

module.exports = mongoose.model('Report', ReportSchema);