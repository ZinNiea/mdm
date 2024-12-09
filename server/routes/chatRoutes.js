// routes/chatRouter.js
const express = require('express');
const chatController = require('../controllers/chatController');
const router = express.Router();

router.get('/:roomId/history', chatController.getChatHistory);

router.post('/:roomId/message', chatController.saveMessage);

module.exports = router;