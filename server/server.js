// server.js
const app = require('./app');
const http = require('http');
const socketIo = require('socket.io');
const chatController = require('./controllers/chatController'); // chatController 불러오기
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
    const { participants } = data;
    try {
      // 참가자들을 정렬하여 비교
      const sortedParticipants = participants.sort();
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
      readCounts[chatRoom._id] = 0;
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('joinRoom', async (roomId) => {
    const chatRoom = await Chat.findById(roomId);
    if (chatRoom) {
      socket.join(roomId);
      console.log(`방 ${roomId}에 입장: ${socket.id}`);
      socket.emit('updateReadCount', readCounts[roomId] || 0);
    } else {
      console.log(`존재하지 않는 방입니다: ${roomId}`);
      // 필요 시 클라이언트에 에러 메시지 전송
      socket.emit('error', { message: '존재하지 않는 방입니다.' });
    }
  });

  // socket.on('chatMessage', async (data) => { 
  //   const { roomId, senderId, message } = data;
  //   // 메시지 저장
  //   try {
  //     await chatController.saveMessage({ params: { roomId }, body: { senderId, message } }, null);

  //     // 메시지를 방에 브로드캐스트
  //     io.to(roomId).emit('chatMessage', { senderId, message, timestamp: new Date() });
  //   } catch (err) {
  //     console.error('메시지 저장 오류:', err);
  //     socket.emit('error', { message: '메시지 저장에 실패했습니다.' });
  //   }
  //   readCounts[roomId] = (readCounts[roomId] || 0) + 1;
  //   io.to(roomId).emit('updateReadCount', readCounts[roomId]);
  // });
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
      await chatController.saveMessage(
        { params: { roomId }, body: { senderId, message } },
        { /* 필요 시 응답 객체 전달 */ }
      );
  
      const timestamp = new Date();
  
      // 메시지를 방에 브로드캐스트
      io.to(roomId).emit('chatMessage', { senderId, message, timestamp });
  
      // 읽음 카운트 업데이트
      readCounts[roomId] = (readCounts[roomId] || 0) + 1;
      io.to(roomId).emit('updateReadCount', readCounts[roomId]);
    } catch (err) {
      console.error('메시지 저장 오류:', err);
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