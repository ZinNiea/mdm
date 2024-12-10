// routes/chatRouter.js
const express = require('express');
const chatController = require('../controllers/chatController');
const router = express.Router();

router.get('/:roomId/history', chatController.getChatHistory);

router.post('/:roomId/message', chatController.saveMessage);

// 새로운 라우트: 유저가 참여하고 있는 채팅방 목록 조회
router.get('/user/:userId/rooms', chatController.getUserChatRooms);

module.exports = router;