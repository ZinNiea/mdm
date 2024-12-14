// server.js
const express = require('express');
const app = express();
const http = require('http');
const socketIo = require('socket.io');
const PORT = process.env.PORT || 3000;

const logger = require('./utils/logger'); // Winston 로거 가져오기
const { Chat } = require('./models/chatModel'); // Chat 모델 가져오기
const { ViewLog } = require('./models/viewLogModel'); // ViewLog 모델 가져오기

// HTTP 서버 생성
const server = http.createServer(app);

// Socket.IO 초기화
const io = socketIo(server, {
  cors: {
    origin: "*", // 필요한 경우 도메인 변경
    methods: ["GET", "POST"]
  }
});

const readCounts = {};

// Socket.IO 연결 설정
io.on('connection', (socket) => {
  console.log('새 클라이언트 접속:', socket.id);

  socket.on('createRoom', async (data) => {
    const { roomId, participants } = data;
    try {
      // 참가자들을 정렬하여 비교
      const sortedParticipants = participants.sort();
      // 동일한 참가자들로 구성된 채팅방 검색
      let chatRoom = await Chat.findOne({ 
        participants: { $size: sortedParticipants.length, $all: sortedParticipants }
      });
      if (!chatRoom) {
        // 채팅방 생성
        chatRoom = new Chat({ roomId, participants: sortedParticipants, messages: [] });
        await chatRoom.save();
        console.log(`새로운 방 생성: ${roomId}`);
      } else {
        console.log(`이미 존재하는 방입니다: ${chatRoom.roomId}`);
      }
      // 방에 소켓 참여
      socket.join(chatRoom.roomId);
      readCounts[chatRoom.roomId] = 0;
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('joinRoom', async (roomId) => {
    const chatRoom = await Chat.findOne({ roomId });
    if (chatRoom) {
      socket.join(roomId);
      console.log(`방 ${roomId}에 입장: ${socket.id}`);
      socket.emit('updateReadCount', readCounts[roomId]);
    } else {
      console.log(`존재하지 않는 방입니다: ${roomId}`);
      // 필요 시 클라이언트에 에러 메시지 전송
      socket.emit('error', { message: '존재하지 않는 방입니다.' });
    }
  });

  socket.on('chatMessage', async (data) => { 
    const { roomId, senderId, message } = data;
    // 메시지 저장
    try {
      const chatRoom = await Chat.findOne({ roomId });
      if (chatRoom) {
        chatRoom.messages.push({ sender: senderId, message });
        await chatRoom.save();
      }
    } catch (err) {
      console.error(err);
    }
    // 메시지 브로드캐스트
    io.to(roomId).emit('chatMessage', { senderId, message });
    readCounts[roomId] += 1;
    io.to(roomId).emit('updateReadCount', readCounts[roomId]);
  });

  // 새로운 이벤트: 채팅방 나가기
  socket.on('leaveRoom', async (data) => {
    const { roomId, profileId } = data;
    socket.leave(roomId);
    console.log(`방 ${roomId}에서 나감: ${socket.id}`);

    // 채팅방에서 유저 제거 로직 (필요 시 추가)
    try {
      const chatRoom = await Chat.findOne({ roomId });
      if (chatRoom) {
        chatRoom.participants = chatRoom.participants.filter(id => id !== profileId);
        await chatRoom.save();
        io.to(roomId).emit('userLeft', { profileId });
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('disconnect', () => {
    console.log('클라이언트 연결 해제:', socket.id);
  });
});

// Socket.IO 인스턴스를 app에 설정하여 다른 모듈에서 접근 가능하게 함
app.set('io', io);

// 서버 시작
server.listen(PORT, () => {
  logger.info(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});