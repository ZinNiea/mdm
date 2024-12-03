// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { marketRoutes } = require('./routes/marketRoutes.js');
const userRouter = require('./routes/userRoutes');
const postRouter = require('./routes/postRoutes');
const { default: mongoose } = require('mongoose');
const app = express();

// app.set('trust proxy', 1); 'trust proxy'를 1로 설정하면 클라이언트의 IP 주소를 신뢰합니다.
app.set('trust proxy', 1);

const MONGO_URI = 'mongodb+srv://p04u:VpJL4ftrjy7RbWO6@cluster0.0nr56.mongodb.net/';
const hostname = '0.0.0.0';
// const port = process.env.PORT || 3000;
const port = 3000;

// if (process.env.NODE_ENV !== 'production') {
//   mongoose.set('debug', true); // 몽고 쿼리가 콘솔에서 뜨게 한다.
// }

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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/user', userRouter);
app.use('/post', postRouter);

app.get('/', (req, res) => {
  res.send('Hello, World! \n This is the main page of the app');
});

// app.listen(port, hostname, () => {
//   console.log(`Server running at http://${hostname}:${port}/`);
// });

module.exports = app;