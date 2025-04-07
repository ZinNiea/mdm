// server/routes/api/chats.routes.js
const express = require('express');
const chatController = require('../../controllers/chat.controller');
const router = express.Router();

router.get('/:roomId/history', chatController.getChatHistory);

router.post('/:roomId/message', chatController.saveMessage);

// 새로운 라우트: 유저가 참여하고 있는 채팅방 목록 조회
router.get('/profiles/:profileId/rooms', chatController.getUserChatRooms);

// 새로운 라우트: 특정 거래 아이템의 채팅방 목록 조회
router.get('/:auctionId/rooms', chatController.getAuctionChatRooms);

// 기존의 startChat, startAuctionChat, startProfileChat 라우트를 하나로 통합
router.post('/start-chat', chatController.startChat);

// 새로운 라우트: 채팅방 나가기
router.post('/:roomId/leave', chatController.leaveChatRoom);

// 새로운 라우트: 특정 프로필을 채팅방으로 초대
router.post('/:roomId/invite', chatController.inviteToChatRoom);

// 새로운 라우트: 특정 유저가 참여 중인 채팅방 목록 조회
// router.get('/rooms/profile', chatController.getUserParticipatingRooms);

module.exports = router;