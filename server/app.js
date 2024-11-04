// app.js
require('dotenv').config();
const express = require('express');
// const { marketRoutes } = require('./routes/marketRoutes.js');
const userRouter = require('./routes/userRoutes');
const postRouter = require('./routes/postRoutes');
const commentRouter = require('./routes/commentRoutes');
const { default: mongoose } = require('mongoose');
const app = express();

const MONGO_URI = 'mongodb+srv://p04u:VpJL4ftrjy7RbWO6@cluster0.0nr56.mongodb.net/';
const hostname = '0.0.0.0';
// const port = process.env.PORT || 3000;
const port = 3000;

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

// app.use('/user', userRouter);
// app.use('/post', postRouter);
// app.use('/comment', commentRouter);

app.get('/', (req, res) => {
  res.send('Hello, World! \n This is the main page of the app');
});

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

module.exports = app;