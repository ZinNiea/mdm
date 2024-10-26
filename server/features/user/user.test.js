// server/features/user/user.test.js
const request = require('supertest');
const app = require('../../app');
const { connectDB } = require('../../db');
const { beforeAll, afterAll } = require('../tests/setup');

describe('User API', () => {
  beforeAll(async () => {
    await connectDB();
  });

  it('should register a new user', async () => {
    const res = await request(app).post('/user/register').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('email', 'john@example.com');
  });

  afterAll(async () => {
    // 테스트 후 cleanup 작업 (테스트 용도로 사용된 데이터베이스 초기화 등)
  });
});
