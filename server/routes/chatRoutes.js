// routes/chatRouter.js
const express = require('express');
const chatController = require('../controllers/chatController');
const router = express.Router();

router.get('/:roomId/history', chatController.getChatHistory);

router.post('/:roomId/message', chatController.saveMessage);

// 새로운 라우트: 유저가 참여하고 있는 채팅방 목록 조회
router.get('/profiles/:profileId/rooms', chatController.getUserChatRooms);

// 새로운 라우트: 특정 거래 아이템의 채팅방 목록 조회
router.get('/:auctionId/rooms', chatController.getAuctionChatRooms);

// 새로운 라우트: 프로필 배열을 사용하여 채팅 시작
router.post('/start-chat', chatController.startChat);

// 새로운 라우트: 거래 채팅방 시작
router.post('/start-auction-chat', chatController.startAuctionChat);

// 새로운 라우트: 프로필 채팅방 시작
router.post('/start-profile-chat', chatController.startProfileChat);

// 새로운 라우트: 채팅방 나가기
router.post('/:roomId/leave', chatController.leaveChatRoom);

// 새로운 라우트: 특정 프로필을 채팅방으로 초대
router.post('/:roomId/invite', chatController.inviteToChatRoom);

module.exports = router;