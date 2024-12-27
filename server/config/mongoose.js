// server/config/mongoose.js
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://p04u:VpJL4ftrjy7RbWO6@cluster0.0nr56.mongodb.net/';

const options = {
  autoIndex: false, // Don't build indexes
  serverSelectionTimeoutMS: 60000, // Keep trying to send operations for 60 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
};

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, options);
    console.log('MongoDB 연결 성공!');
  } catch (err) {
    console.error('MongoDB 연결 에러:', err);
    process.exit(1);
  }
};

module.exports = connectDB;