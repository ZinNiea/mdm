// controllers/chatController.js
const mongoose = require('mongoose');
const { Request, Response } = require('express');
const { Chat } = require('../models/chatModel');
const { CHAT_CATEGORY } = require('../models/constants'); // 상수 불러오기

/**
 * 채팅 기록 조회(GET /api/chats/:roomId/history)
 * @param {Request} req
 * @param {Response} res
 */
exports.getChatHistory = async (req, res) => {
  const { roomId } = req.params;
  try {
    const chatRoom = await Chat.findById(roomId).populate('messages.sender');
    if (!chatRoom) return res.status(404).send('채팅방을 찾을 수 없습니다.');
    res.status(200).json(chatRoom.messages);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

/**
 * 메시지 저장 함수 수정
 * @param {Object} data - 메시지 데이터
 * @param {Function} callback - 완료 후 호출할 콜백 함수
 */
exports.saveMessage = async (data) => {
  const { roomId } = data.params;
  const { senderId, message } = data.body;

  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    throw new Error('유효하지 않은 방 ID입니다.');
  }

  try {
    const chatRoom = await Chat.findById(roomId);
    if (!chatRoom) {
      throw new Error('채팅방을 찾을 수 없습니다.');
    }

    // 메시지 저장
    chatRoom.messages.push({ sender: senderId, message, timestamp: new Date() });
    await chatRoom.save();

    // 저장된 메시지의 고유 ID 반환
    const savedMessage = chatRoom.messages[chatRoom.messages.length - 1];
    return { success: true, messageId: savedMessage._id };
  } catch (err) {
    throw err;
  }
};

/**
 * 유저가 참여하고 있는 채팅방 목록 조회(GET /api/chats/profile/:profileId/rooms)
 * @param {Request} req
 * @param {Response} res
 */
exports.getUserChatRooms = async (req, res) => {
  const { profileId } = req.params;
  const { category } = req.query; // category 추가
  try {
    const filter = { 'participants.profile': new mongoose.Types.ObjectId(profileId) };
    if (category) {
      filter.category = category;
    }

    const chatRooms = await Chat.find(filter)
      .select('_id auctionItem createdAt') // 필요한 필드 선택
      .populate('auctionItem', 'title'); // 경매 아이템의 제목 정보 포함 (필요 시 추가 필드 지정)

    res.status(200).json(chatRooms);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

/**
 * 특정 거래 아이템의 채팅방 목록 조회(GET /api/chats/auction/:itemId/rooms)
 * @param {Request} req
 * @param {Response} res
 */
exports.getAuctionChatRooms = async (req, res) => {
  const { auctionId } = req.params;
  try {
    const chatRooms = await Chat.find({ auctionItem: auctionId })
      .select('_id participants createdAt') // 필요한 필드 선택
      .populate('participants', 'nickname profileImage'); // 참가자 정보 포함

    res.status(200).json(chatRooms);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

/**
 * 프로필 ID 배열을 사용하여 채팅을 시작하거나 기존 채팅방 ID 반환 (POST /api/chats/start-chat)
 * @param {Request} req
 * @param {Response} res
 */
exports.startChat = async (req, res) => {
  const { profileIds, category, auctionItemId } = req.body;

  // category 유효성 검사
  if (!category || !Object.values(CHAT_CATEGORY).includes(category)) {
    return res.status(400).json({ message: '유효한 category가 필요합니다.' });
  }

  // 프로필 ID 배열 유효성 검사
  if (
    !Array.isArray(profileIds) ||
    profileIds.length !== 2 ||
    new Set(profileIds).size !== 2
  ) {
    return res.status(400).json({ message: 'profileIds는 정확히 두 개의 고유한 ID를 포함하는 배열이어야 합니다.' });
  }

  try {
    const filter = {
      participants: { $all: profileIds },
      category: category,
      'participants.2': { $exists: false },
    };

    if (category === CHAT_CATEGORY.AUCTION) {
      if (!auctionItemId) {
        return res.status(400).json({ message: '거래 채팅방은 auctionItemId가 필요합니다.' });
      }
      filter.auctionItem = auctionItemId;
    }

    // 이미 존재하는 채팅방 찾기
    const existingChat = await Chat.findOne(filter);

    if (existingChat) {
      return res.status(200).json({ chatRoomId: existingChat._id });
    }

    // 새로운 채팅방 생성
    const newChatData = {
      participants: profileIds,
      category: category,
      createdAt: new Date(),
      messages: [],
    };

    if (category === CHAT_CATEGORY.AUCTION) {
      newChatData.auctionItem = auctionItemId;
    }

    const newChatRoom = new Chat(newChatData);
    await newChatRoom.save();

    res.status(201).json({ chatRoomId: newChatRoom._id });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

/**
 * 채팅방 나가기(POST /api/chats/:roomId/leave)
 * @param {Request} req
 * @param {Response} res
 */
exports.leaveChatRoom = async (req, res) => {
  const { roomId } = req.params;
  const { profileId } = req.body;

  try {
    const chatRoom = await Chat.findById(roomId);
    if (!chatRoom) return res.status(404).send('채팅방을 찾을 수 없습니다.');

    if (!chatRoom.participants.includes(profileId)) {
      return res.status(400).send('유저가 이 채팅방의 참가자가 아닙니다.');
    }

    chatRoom.participants = chatRoom.participants.filter(id => id.toString() !== profileId);
    await chatRoom.save();

    res.status(200).send('채팅방을 성공적으로 나갔습니다.');
  } catch (err) {
    res.status(500).send(err.message);
  }
};

/**
 * 특정 프로필을 채팅방으로 초대(POST /api/chats/:roomId/invite)
 * @param {Request} req
 * @param {Response} res
 */
exports.inviteToChatRoom = async (req, res) => {
  const { roomId } = req.params;
  const { profileId } = req.body;

  try {
    const chatRoom = await Chat.findOne({ roomId: roomId });
    if (!chatRoom) return res.status(404).send('채팅방을 찾을 수 없습니다.');

    if (chatRoom.participants.includes(profileId)) {
      return res.status(400).send('유저가 이미 이 채팅방에 참여하고 있습니다.');
    }

    chatRoom.participants.push(profileId);
    await chatRoom.save();

    res.status(200).send('유저가 채팅방에 성공적으로 초대되었습니다.');
    
    // 선택 사항: Socket.IO를 통해 실시간 알림 전송
    const io = req.app.get('io');
    io.to(roomId).emit('userInvited', { profileId });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

/**
 * 특정 유저가 참여 중인 채팅방 목록 조회(GET /api/chats/user/:userId/rooms)
 * @param {Request} req
 * @param {Response} res
 */
exports.getUserParticipatingRooms = async (req, res) => {
  const { profileId } = req.query;
  try {
    const chatRooms = await Chat.find({ 'participants.profile': profileId })
      .select('_id participants createdAt messages') 
      .populate({
        path: 'participants.profile',
        select: 'nickname profileImage'
      });

    const roomsData = chatRooms.map(room => {
      // 현재 유저를 제외한 참여자 정보
      const otherParticipants = room.participants.filter(p => p.profile._id.toString() !== profileId);

      // 마지막 메시지와 그 시간
      const lastMessage = room.messages.length > 0 ? room.messages[room.messages.length - 1] : null;

      // 읽지 않은 메시지 여부 판단
      const currentUser = room.participants.find(p => p.profile._id.toString() === profileId);
      const lastRead = currentUser ? currentUser.lastReadTimestamp : new Date(0);
      const unreadMessages = room.messages.some(message => message.timestamp > lastRead);

      return {
        _id: room._id,
        createdAt: room.createdAt,
        lastMessage: lastMessage ? {
          sender: lastMessage.sender,
          message: lastMessage.message,
          timestamp: lastMessage.timestamp
        } : null,
        unreadMessages: unreadMessages,
        participants: otherParticipants.map(p => ({
          _id: p.profile._id,
          nickname: p.profile.nickname,
          profileImage: p.profile.profileImage
        }))
      };
    });

    res.status(200).json(roomsData);
  } catch (err) {
    res.status(500).send(err.message);
  }
};