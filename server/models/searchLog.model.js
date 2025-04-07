// server/models/searchLog.model.js
const mongoose = require('mongoose');
const { MODELS } = require('../constants/constants');

const searchLogSchema = new mongoose.Schema({
    keyword: { type: String, required: true },
    searchedAt: { type: Date, default: Date.now }
});

const SearchLog = mongoose.model(MODELS.SEARCHLOG, searchLogSchema);
module.exports = { SearchLog };
