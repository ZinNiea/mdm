// server.js
const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  app.logger.info(`Server is running on port ${PORT}`);
  // console.log(`Server is running on port ${PORT}`);
});