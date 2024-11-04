// server/app.js - 애플리케이션의 주요 로직
require('dotenv').config();
const express = require('express');
// const { userRoutes } = require('./features/user/index.js');
// const { postRoutes } = require('./routes/index.js');
// const { marketRoutes } = require('./routes/marketRoutes.js');
const userRouter = require('./routes/userRoutes');
const postRouter = require('./routes/postRoutes');
const commentRouter = require('./routes/commentRoutes');
const { default: mongoose } = require('mongoose');
const app = express();

const MONGO_URI = process.env.MONGO_URI;

if (process.env.NODE_ENV !== 'production') {
  mongoose.set('debug', true); // 몽고 쿼리가 콘솔에서 뜨게 한다.
}
mongoose.connect(MONGO_URI, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected!'))
  .catch((err) => console.log(err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/user', userRouter);
app.use('/post', postRouter);
app.use('/comment', commentRouter);

app.get('/', (req, res) => {
  res.send('Hello, World! \n This is the main page of the app');
});

module.exports = app;