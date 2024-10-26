// server/db.js - MySQL 데이터베이스 연결 설정
const mysql = require('mysql2/promise');

let connection;

const connectDB = async () => {
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root'
    });
    console.log('MySQL connected');
  } catch (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  }
};

const getConnection = () => connection;

module.exports = { connectDB, getConnection };
