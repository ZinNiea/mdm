// server/user/userModel.js
const mysql = require('mysql2/promise');
const { getConnection } = require('../../db');

const createUser = async (user) => {
  const connection = getConnection();
  const { name, email, password } = user;
  // 한국 시간(KST)으로 변환
  // 현재 시간 생성 및 한국 시간(KST)으로 변환
  const createdAt = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  
  // 연, 월, 일까지만 포함된 변수 생성
  const createdDate = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
  
  const [result] = await connection.query(
    'INSERT INTO `member`.`users` (name, email, password, created_at) VALUES (?, ?, ?, ?)',
    [name, email, password, createdAt]
  );
  return result.insertId;
};

const getUserByEmail = async (email) => {
  const connection = getConnection();
  const [rows] = await connection.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0];
};

module.exports = {
  createUser,
  getUserByEmail
};