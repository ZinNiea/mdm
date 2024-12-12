// controllers/chatController.js
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
 * 유저가 참여하고 있는 채팅방 목록 조회(GET /api/chats/profile/:profileId/rooms)
 * @param {Request} req
 * @param {Response} res
 */
exports.getUserChatRooms = async (req, res) => {
  const { profileId } = req.params;
  const { category } = req.query; // category 추가
  try {
    const filter = { participants: profileId };
    if (category) {
      filter.category = category;
    }

    const chatRooms = await Chat.find(filter)
      .select('roomId auctionItem createdAt') // 필요한 필드 선택
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
      .select('roomId participants createdAt') // 필요한 필드 선택
      .populate('participants', 'nickname profileImage'); // 참가자 정보 포함

    res.status(200).json(chatRooms);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

/**
 * 프로필 ID 배열을 사용하여 채팅을 시작하거나 기존 채��방 ID 반환 (POST /api/chats/start-chat)
 * @param {Request} req
 * @param {Response} res
 */
exports.startChat = async (req, res) => {
  const { profileIds } = req.body;

  // 프로필 ID 배열 유효성 검사
  if (
    !Array.isArray(profileIds) ||
    profileIds.length !== 2 ||
    new Set(profileIds).size !== 2
  ) {
    return res.status(400).json({ message: 'profileIds는 정확히 두 개의 고유한 ID를 포함하는 배열이어야 합니다.' });
  }

  const [profileId1, profileId2] = profileIds;

  try {
    // 이미 존재하는 채팅방 찾기 (참가자가 정확히 두 명인 경우)
    const existingChat = await Chat.findOne({
      participants: { $all: [profileId1, profileId2] },
      'participants.2': { $exists: false } // 참가자가 두 명인 경우
    });

    if (existingChat) {
      return res.status(200).json({ chatRoomId: existingChat._id });
    }

    // 새로운 채팅방 생성
    const newChatRoom = new Chat({
      participants: [profileId1, profileId2],
      createdAt: new Date(),
      messages: []
    });

    await newChatRoom.save();

    res.status(201).json({ chatRoomId: newChatRoom._id });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

/**
 * 거래 채팅방을 시작하거나 기존 채팅방 ID 반환 (POST /api/chats/start-auction-chat)
 * @param {Request} req
 * @param {Response} res
 */
exports.startAuctionChat = async (req, res) => {
  const { profileIds, auctionItemId } = req.body;

  // 프로필 ID 배열 유효성 검사
  if (
    !Array.isArray(profileIds) ||
    profileIds.length !== 2 ||
    new Set(profileIds).size !== 2
  ) {
    return res.status(400).json({ message: 'profileIds는 정확히 두 개의 고유한 ID를 포함하는 배열이어야 합니다.' });
  }

  if (!auctionItemId) {
    return res.status(400).json({ message: 'auctionItemId가 필요합니다.' });
  }

  const [profileId1, profileId2] = profileIds;

  try {
    // 이미 존재하는 거래 채팅방 찾기
    const existingChat = await Chat.findOne({
      participants: { $all: [profileId1, profileId2] },
      auctionItem: auctionItemId,
      category: CHAT_CATEGORY.AUCTION, // 상수 사용
      'participants.2': { $exists: false } // 참가자가 두 명인 경우
    });

    if (existingChat) {
      return res.status(200).json({ chatRoomId: existingChat._id });
    }

    // 새로운 거래 채팅방 생성
    const newChatRoom = new Chat({
      participants: [profileId1, profileId2],
      auctionItem: auctionItemId,
      category: CHAT_CATEGORY.AUCTION, // 상수 사용
      createdAt: new Date(),
      messages: []
    });

    await newChatRoom.save();

    res.status(201).json({ chatRoomId: newChatRoom._id });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

/**
 * 프로필 채팅방을 시작하거나 기존 채팅방 ID 반환 (POST /api/chats/start-profile-chat)
 * @param {Request} req
 * @param {Response} res
 */
exports.startProfileChat = async (req, res) => {
  const { profileIds } = req.body;

  // 프로필 ID 배열 유효성 검사
  if (
    !Array.isArray(profileIds) ||
    profileIds.length !== 2 ||
    new Set(profileIds).size !== 2
  ) {
    return res.status(400).json({ message: 'profileIds는 정확히 두 개의 고유한 ID를 포함하는 배열이어야 합니다.' });
  }

  const [profileId1, profileId2] = profileIds;

  try {
    // 이미 존재하는 프로필 채팅방 찾기
    const existingChat = await Chat.findOne({
      participants: { $all: [profileId1, profileId2] },
      auctionItem: { $exists: false }, // auctionItem이 없는 경우
      category: CHAT_CATEGORY.PROFILE, // 상수 사용
      'participants.2': { $exists: false } // 참가자가 두 명인 경우
    });

    if (existingChat) {
      return res.status(200).json({ chatRoomId: existingChat._id });
    }

    // 새로운 프로필 채팅방 생성
    const newChatRoom = new Chat({
      participants: [profileId1, profileId2],
      category: CHAT_CATEGORY.PROFILE, // 상수 사용
      createdAt: new Date(),
      messages: []
    });

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
    const chatRoom = await Chat.findOne({ roomId: roomId });
    if (!chatRoom) return res.status(404).send('채팅방을 찾을 수 없습니다.');

    if (!chatRoom.participants.includes(profileId)) {
      return res.status(400).send('유저가 이 채팅방의 참가자가 아닙니다.');
    }

    chatRoom.participants = chatRoom.participants.filter(id => id !== profileId);
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