// app.js
require('dotenv').config();
const express = require('express');
const { default: mongoose } = require('mongoose');
const cors = require('cors');
const loggingMiddleware = require('./middlewares/logging'); // 미들웨어 가져오기
const userRouter = require('./routes/userRoutes');
const postRouter = require('./routes/postRoutes');
const auctionRouter = require('./routes/auctionRoutes');
const chatRouter = require('./routes/chatRoutes');

const app = express();

// app.set('trust proxy', 1); 'trust proxy'를 1로 설정하면 클라이언트의 IP 주소를 신뢰합니다.
app.set('trust proxy', 1);

const MONGO_URI = 'mongodb+srv://p04u:VpJL4ftrjy7RbWO6@cluster0.0nr56.mongodb.net/';

if (process.env.NODE_ENV !== 'production') {
  mongoose.set('debug', true); // 몽고 쿼리가 콘솔에서 뜨게 한다.
}


// MongoDB 연결
const options = {
  autoIndex: false, // Don't build indexes
  serverSelectionTimeoutMS: 60000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
}
mongoose.connect(MONGO_URI, options)
// .then(() => console.log('MongoDB connected!'))
//   .catch((err) => console.log('MongoDB connection error: ', err))
  ;

// CORS 미들웨어 적용
app.use(cors());
// JSON 파싱 미들웨어 적용
app.use(express.json());
// URL 인코딩 미들웨어 적용
app.use(express.urlencoded({ extended: true }));

// 로깅 미들웨어 적용
app.use(loggingMiddleware);

// 라우터 등록
app.use('/user', userRouter);
app.use('/post', postRouter);
app.use('/auctions', auctionRouter);
app.use('/chat', chatRouter);

app.get('/', (req, res) => {
  res.send('Hello, World! \n This is the main page of the app');
});

// app.listen(port, hostname, () => {
//   console.log(`Server running at http://${hostname}:${port}/`);
// });

module.exports = app;