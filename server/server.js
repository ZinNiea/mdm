// server.js
const app = require('./app');
const http = require('http');
const socketIo = require('socket.io');
const PORT = process.env.PORT || 3000;

const logger = require('./utils/logger'); // Winston 로거 가져오기

// HTTP 서버 생성
const server = http.createServer(app);

// Socket.IO 초기화
const io = socketIo(server, {
  cors: {
    origin: "*", // 필요한 경우 도메인 변경
    methods: ["GET", "POST"]
  }
});

// Socket.IO 연결 설정
io.on('connection', (socket) => {
  console.log('새 클라이언트 접속:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`방 ${roomId}에 참여: ${socket.id}`);
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