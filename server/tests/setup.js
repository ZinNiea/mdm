// const request = require('supertest');
// const app = require('../index');

// describe('GET /', () => {
//     it('should return Hello, World!', async () => {
//         const res = await request(app).get('/');
//         expect(res.statusCode).toEqual(200);
//         expect(res.text).toBe('Hello, World!');
//     });
// });

// server/tests/setup.js
const mysql = require('mysql2/promise');
const { getConnection } = require('../db');

beforeAll(async () => {
  const connection = getConnection();
  await connection.query('CREATE DATABASE IF NOT EXISTS testdb');
  await connection.query('USE testdb');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255)
    )
  `);
});

afterAll(async () => {
  const connection = getConnection();
  await connection.query('DROP DATABASE testdb');
  connection.end();
});
