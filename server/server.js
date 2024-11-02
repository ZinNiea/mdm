// server/server.js - 서버 설정 및 실행
require('dotenv').config();
const app = require('./app');

const hostname = process.env.HOSTNAME // || '127.0.0.1';
const port = process.env.PORT // || 3000;

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
