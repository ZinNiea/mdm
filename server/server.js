// server.js
const app = require('./app');
const http = require('http');
const socketIo = require('socket.io');
const chatController = require('./controllers/chatController'); // chatController 불러오기
const PORT = process.env.PORT || 3000;

const logger = require('./utils/logger'); // Winston 로거 가져오기
const { Chat, Message } = require('./models/chatModel'); // Chat, Message 모델 가져오기
const { ViewLog } = require('./models/viewLogModel'); // ViewLog 모델 가져오기

const mongoose = require('mongoose');
const { CHAT_CATEGORY } = require('./models/constants');

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
      const newChatRoom = new Chat({ participants, category: CHAT_CATEGORY.AUCTION });
      await newChatRoom.save();

      socket.join(newChatRoom._id.toString());

      // 방 생성 성공 메시지 전송
      socket.emit('roomCreatedSuccess', { newChatRoom: newChatRoom });
    } catch (error) {
      console.error(error);
      socket.emit('error', { message: 'createRoom 도중 오류가 발생했습니다.' });
    }
  });

  socket.on('joinRoom', async (data) => {
    const { roomId, profileId } = data;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return socket.emit('error', { message: '유효하지 않은 방 ID입니다.' });
    }

    try {
      const chatRoom = await Chat.findById(roomId);

      // 존재하지 않는 방일 경우 에러 처리
      if (!chatRoom) {
        return socket.emit('error', { message: '존재하지 않는 방입니다.' });
      }

      // 사용자가 채팅방의 참가자인지 확인
      if (!chatRoom.participants.some(participantId => participantId.equals(profileId))) {
        return socket.emit('error', { message: '채팅방에 참여할 권한이 없습니다.' });
      }

      socket.join(roomId);
      // 입장 시, 최초 입장 메세지 전송
      socket.emit('joinRoomSuccess', { roomId, message: '방에 성공적으로 참여했습니다.' });
    } catch (error) {
      console.error(error);
      socket.emit('error', { message: 'joinRoom 도중 오류가 발생했습니다.' });
    }
  });

  socket.on('chatMessage', async (data) => {
    const { roomId, senderId, message } = data;

    // 데이터 검증
    if (!roomId || !senderId || !message) {
      return socket.emit('error', { message: '유효하지 않은 메시지 데이터입니다.' });
    }

    try {
      // 채팅방 존재 여부 확인
      const chatRoom = await Chat.findById(roomId);
      if (!chatRoom) {
        return socket.emit('error', { message: '채팅방이 존재하지 않습니다.' });
      }

      //!< 사용자의 채팅방 참여 여부 확인
      if (!chatRoom.participants.some(participantId => participantId.equals(senderId))) {
        return socket.emit('error', { message: '채팅방에 소속된 사용자가 아닙니다.' });
      }

      const messageInstance = new Message({ chat: roomId, sender: senderId, message });
      await messageInstance.save();

      await Chat.findByIdAndUpdate(roomId, {
        lastMessage: { sender: senderId, message: message, timestamp: messageInstance.timestamp }
      });

      // 메시지를 방에 브로드캐스트
      io.to(roomId).emit('broadcastMessage', { senderId: senderId, message: message, timestamp: messageInstance.timestamp, messageId: messageInstance._id });

      /*  레거시
      // 메시지 저장 및 메시지 ID 획득
      const result = await chatController.saveMessage({ params: { roomId }, body: { senderId, message } });
      socket.emit('messageSaved', { message: '메시지가 저장되었습니다.' });

      const timestamp = new Date();

      // 메시지를 방에 브로드캐스트
      io.to(roomId).emit('broadcastMessage', { senderId, message, timestamp, messageId: result.messageId });

      // 읽음 카운트 업데이트
      readCounts[roomId] = (readCounts[roomId] || 0) + 1;
      io.to(roomId).emit('updateReadCount', readCounts[roomId]);
       */
    } catch (error) {
      logger.error('메시지 저장 오류:', error);
      socket.emit('error', { message: '메시지 저장에 실패했습니다.' });
    }
  });

  // 채팅방에서 탈퇴
  socket.on('leaveRoom', async (data) => {
    const { roomId, profileId } = data;

    try {
      socket.leave(roomId);

      //!< 채팅방에서 참가자 제거
      await Chat.findByIdAndUpdate(chatRoomId, {
        $pull: { participants: profileId }
      });

      //!< 방에 남아있는 참가자에게 사용자가 나갔음을 알림
      io.to(roomId).emit('userLeft', { profileId, message: '사용자가 채팅방을 나갔습니다.', chatRoomId: roomId });
    } catch (error) {
      console.error(error);
      socket.emit('error', { message: '채팅방 탈퇴(leaveRoom) 중 오류가 발생했습니다.' });
    }
  });

  // Event handler for rejoining a chat room
  // This handler allows a user to rejoin a chat room and updates the last read time
  socket.on('rejoinRoom', async (data) => {
    const { roomId, lastReadTime } = data;

    try {
      const chatRoom = await Chat.findById(roomId);
      if (!chatRoom) {
        return socket.emit('error', { message: '존재하지 않는 방입니다.' });
      }
      if (!lastReadTime || isNaN(Date.parse(lastReadTime))) {
        return socket.emit('error', { message: '유효하지 않은 시간 정보입니다.' });
      }

      socket.join(roomId);
      const offlineMessages = await Message.find({
        chat: roomId,
        timestamp: { $gt: new Date(lastReadTime) }
      }).sort({ timestamp: 1 });

      //!< 지정 방식
      // socket.emit('chatHistory', offlineMessages
      //   .map(msg => ({ sender: msg.sender, message: msg.message, timestamp: msg.timestamp })));

      //!< 변경 방식
      socket.emit('chatHistory', offlineMessages);
    } catch (error) {
      console.error(error);
      return socket.emit('error', { message: '방 재입장 중 오류가 발생했습니다.' });
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