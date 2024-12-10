// controllers/chatController.js
const { Request, Response } = require('express');
const { Chat } = require('../models/chatModel');

/**
 * 채팅 기록 조회(GET /api/chats/:roomId/history)
 * @param {Request} req
 * @param {Response} res
 */
exports.getChatHistory = async (req, res) => {
  const { roomId } = req.params;
  try {
    const chatRoom = await Chat.findOne({ roomId: roomId }).populate('messages.sender');
    if (!chatRoom) return res.status(404).send('채팅방을 찾을 수 없습니다.');
    res.status(200).json(chatRoom.messages);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

/**
 * 메시지 저장(POST /api/chats/:roomId/message)
 * @param {Request} req
 * @param {Response} res
 */
exports.saveMessage = async (req, res) => {
  const { roomId } = req.params;
  const { senderId, message } = req.body;
  try {
    const chatRoom = await Chat.findOne({ roomId: roomId });
    if (!chatRoom) return res.status(404).send('채팅방을 찾을 수 없습니다.');
    
    chatRoom.messages.push({ sender: senderId, message });
    await chatRoom.save();
    
    res.status(201).send('메시지가 저장되었습니다.');
  } catch (err) {
    res.status(500).send(err.message);
  }
};

/**
 * 유저가 참여하고 있는 채팅방 목록 조회(GET /api/chats/user/:userId/rooms)
 * @param {Request} req
 * @param {Response} res
 */
exports.getUserChatRooms = async (req, res) => {
  const { userId } = req.params;
  try {
    const chatRooms = await Chat.find({ participants: userId })
      .select('roomId auctionItem createdAt') // 필요한 필드 선택
      .populate('auctionItem', 'title'); // 경매 아이템의 제목 정보 포함 (필요 시 추가 필드 지정)

    res.status(200).json(chatRooms);
  } catch (err) {
    res.status(500).send(err.message);
  }
};