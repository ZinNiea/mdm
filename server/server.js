// server.js
const app = require('./app');
const http = require('http');
const socketIo = require('socket.io');
const chatController = require('./controllers/chatController'); // chatController 불러오기
const PORT = process.env.PORT || 3000;

const logger = require('./utils/logger'); // Winston 로거 가져오기
const { Chat } = require('./models/chatModel'); // Chat 모델 가져오기
const { ViewLog } = require('./models/viewLogModel'); // ViewLog 모델 가져오기

const mongoose = require('mongoose');

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
    const { participants } = data;
    try {
      // 참가자들을 정렬하여 비교
      const sortedParticipants = participants.slice().sort();
      // 동일한 참가자들로 구성된 채팅방 검색
      let chatRoom = await Chat.findOne({
        participants: { $size: sortedParticipants.length, $all: sortedParticipants }
      });
      if (!chatRoom) {
        // 채팅방 생성
        chatRoom = new Chat({ participants: sortedParticipants, messages: [] });
        await chatRoom.save();
        console.log(`새로운 방 생성: ${chatRoom._id}`);
      } else {
        console.log(`이미 존재하는 방입니다: ${chatRoom._id}`);
      }
      // 방에 소켓 참여
      socket.join(chatRoom._id.toString());
      if (!readCounts.hasOwnProperty(chatRoom._id)) {
        readCounts[chatRoom._id] = 0;
      }
      socket.emit('joinRoomSuccess', { roomId: chatRoom._id, message: '방에 성공적으로 참여했습니다.' });
    } catch (err) {
      console.error(err);
      socket.emit('error', { message: '방 생성 중 오류가 발생했습니다.' });
    }
  });

  socket.on('joinRoom', async (data) => {
    const { roomId, profileId } = data; // profileId 추가

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return socket.emit('error', { message: '유효하지 않은 방 ID입니다.' });
    }

    try {
      const chatRoom = await Chat.findById(roomId);
      if (chatRoom) {
        // 권한 검증: 사용자가 채팅방의 참가자인지 확인
        if (!chatRoom.participants.includes(profileId)) {
          return socket.emit('error', { message: '채팅방에 참여할 권한이 없습니다.' });
        }

        socket.join(roomId);
        console.log(`방 ${roomId}에 입장: ${socket.id}`);

        // 방의 이전 메시지들을 클라이언트에게 전송
        socket.emit('chatHistory', chatRoom.messages);

        socket.emit('updateReadCount', readCounts[roomId] || 0);
      } else {
        console.log(`존재하지 않는 방입니다: ${roomId}`);
        socket.emit('error', { message: '존재하지 않는 방입니다.' });
      }
    } catch (err) {
      console.error(err);
      socket.emit('error', { message: '채팅방에 참가하는 중 오류가 발생했습니다.' });
    }
  });

  socket.on('chatMessage', async (data) => { 
    const { roomId, senderId, message } = data;

    // 데이터 검증
    if (!roomId || !senderId || !message) {
      return socket.emit('error', { message: '유효하지 않은 메시지 데이터입니다.' });
    }

    try {
      // 채팅방 존재 여부 및 사용자의 참여 확인
      const chatRoom = await Chat.findById(roomId);
      if (!chatRoom) {
        return socket.emit('error', { message: '채팅방이 존재하지 않습니다.' });
      }

      if (!chatRoom.participants.includes(senderId)) {
        return socket.emit('error', { message: '채팅방에 참여하고 있지 않습니다.' });
      }

      // 메시지 저장
      await chatController.saveMessage({ params: { roomId }, body: { senderId, message } });
      logger.info('메시지가 성공적으로 저장되었습니다.');
      socket.emit('messageSaved', { message: '메시지가 저장되었습니다.' });

      const timestamp = new Date();

      // 메시지를 방에 브로드캐스트
      io.to(roomId).emit('broadcastMessage', { senderId, message, timestamp });

      // 읽음 카운트 업데이트
      readCounts[roomId] = (readCounts[roomId] || 0) + 1;
      io.to(roomId).emit('updateReadCount', readCounts[roomId]);
    } catch (err) {
      logger.error('메시지 저장 오류:', err);
      socket.emit('error', { message: '메시지 저장에 실패했습니다.' });
    }
  });

  // 새로운 이벤트: 채팅방 나가기
  socket.on('leaveRoom', async (data) => {
    const { roomId, profileId } = data;
    socket.leave(roomId);
    console.log(`방 ${roomId}에서 나감: ${socket.id}`);

    // 채팅방에서 유저 제거 로직 (필요 시 추가)
    try {
      const chatRoom = await Chat.findById(roomId);
      if (chatRoom) {
        chatRoom.participants = chatRoom.participants.filter(id => id.toString() !== profileId);
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