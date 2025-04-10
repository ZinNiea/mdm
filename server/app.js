// app.js
require('dotenv').config();
const express = require('express');
const { default: mongoose, connect } = require('mongoose');
const cors = require('cors');
const loggingMiddleware = require('./middlewares/logging'); // 미들웨어 가져오기
const apiRouter = require('./routes/api/index'); // api 라우터 가져오기
// const adminRouter = require('./routes/admin/index'); // admin 라우터 가져오기
const connectDB = require('./config/mongoose');

const app = express();

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerAllowedIPs = [];

//!< swagger auto gen
const swaggerFile = require('./swagger-output');

// swagger-autogen으로 생성된 파일 불러오기
let swaggerSpec;

try {
  // 자동 생성된 파일 사용 시도
  swaggerSpec = require('./swagger-output.json');
} catch (error) {
  // 파일이 없으면 기존 설정 사용
  swaggerSpec = require('./docs/swagger.options');
  console.log('자동 생성된 swagger 문서를 찾을 수 없습니다. 기본 문서를 사용합니다.');
  console.log('npm run swagger-autogen 명령어로 문서를 생성할 수 있습니다.');
}

// Basic 인증 미들웨어
const basicAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="401"');
    return res.status(401).send('인증이 필요합니다.');
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  const validUser = process.env.SWAGGER_USER;
  const validPass = process.env.SWAGGER_PASSWORD;

  if (username === validUser && password === validPass) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="401"');
  return res.status(401).send('인증이 필요합니다.');
};

// IP 화이트리스트 미들웨어
const ipWhitelist = (req, res, next) => {
  const clientIP = req.ip;

  if (allowedIPs.includes(clientIP)) {
    return next();
  } else {
    return res.status(403).send('접근이 금지되었습니다.');
  }
};

// app.set('trust proxy', 1); 'trust proxy'를 1로 설정하면 클라이언트의 IP 주소를 신뢰합니다.
app.set('trust proxy', 1);

if (process.env.NODE_ENV !== 'production') {
  mongoose.set('debug', true); // 몽고 쿼리가 콘솔에서 뜨게 한다.
}

// MongoDB 연결
connectDB();

// Swagger 미들웨어 적용 전에 IP 화이트리스트와 Basic Auth 미들웨어 추가
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
app.use('/api', apiRouter);
// app.use('/admin', adminRouter);

app.get('/', (req, res) => {
  res.send('Hello, World! \n This is the main page of the app');
});

app.get('/hello', (req, res) => {
  res.send('Hello, World! \n swagger-ui-express is working');
});

module.exports = app;