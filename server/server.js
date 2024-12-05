// server.js
const app = require('./app');
const PORT = process.env.PORT || 3000;

const logger = require('./utils/logger'); // Winston 로거 가져오기

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  // console.log(`Server is running on port ${PORT}`);
});