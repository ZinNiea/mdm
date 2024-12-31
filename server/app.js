// app.js
require('dotenv').config();
const express = require('express');
const { default: mongoose, connect } = require('mongoose');
const cors = require('cors');
const loggingMiddleware = require('./middlewares/logging'); // 미들웨어 가져오기
const userRouter = require('./routes/userRoutes');
const postRouter = require('./routes/postRoutes');
const auctionRouter = require('./routes/auctionRoutes');
const chatRouter = require('./routes/chatRoutes');
const authRouter = require('./routes/authRoutes');
const connectDB = require('./config/mongoose');

const app = express();

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerSpec = require('./docs/swaggerOptions');

// app.set('trust proxy', 1); 'trust proxy'를 1로 설정하면 클라이언트의 IP 주소를 신뢰합니다.
app.set('trust proxy', 1);

if (process.env.NODE_ENV !== 'production') {
  mongoose.set('debug', true); // 몽고 쿼리가 콘솔에서 뜨게 한다.
}

// MongoDB 연결
connectDB();

// Swagger 미들웨어 적용
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// CORS 미들웨어 적용
app.use(cors());
// JSON 파싱 미들웨어 적용
app.use(express.json());
// URL 인코딩 미들웨어 적용
app.use(express.urlencoded({ extended: true }));

// 로깅 미들웨어 적용
app.use(loggingMiddleware);

// 라우터 등록
app.use('/users', userRouter);
app.use('/posts', postRouter);
app.use('/auctions', auctionRouter);
app.use('/chat', chatRouter);
app.use('/auth', authRouter);

app.get('/', (req, res) => {
  res.send('Hello, World! \n This is the main page of the app');
});

app.get('/hello', (req, res) => {
  res.send('Hello, World! \n swagger-ui-express is working');
});

module.exports = app;