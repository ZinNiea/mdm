const request = require('supertest');
const app = require('../app');
const userController = require('./userController');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { isUsernameTaken, isEmailTaken } = require('../utils/userUtils');

// server/controllers/userController.test.js


jest.mock('../models/userModel');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../utils/userUtils');

app.post('/register', userController.registerUser);

describe('registerUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a user successfully', async () => {
    isUsernameTaken.mockResolvedValue(false);
    isEmailTaken.mockResolvedValue(false);
    bcrypt.hash.mockResolvedValue('hashedPassword');
    
    const response = await request(app)
      .post('/register')
      .send({
        username: 'testuser',
        password: 'Password1!',
        email: 'test@naver.com',
        age: 25,
        nickname: 'Tester'
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      result: true,
      message: '회원가입에 성공했습니다.'
    });
    expect(isUsernameTaken).toHaveBeenCalledWith('testuser');
    expect(isEmailTaken).toHaveBeenCalledWith('test@naver.com');
    expect(bcrypt.hash).toHaveBeenCalledWith('Password1!', 10);
  }, 50000);

  it('should fail if password does not meet criteria', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        username: 'testuser',
        password: 'pass',
        email: 'test@naver.com',
        age: 25,
        nickname: 'Tester'
      });

    expect(response.status).toBe(400);
    expect(response.body.result).toBe(false);
  });

  it('should fail if email domain is not allowed', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        username: 'testuser',
        password: 'Password1!',
        email: 'test@gmail.com',
        age: 25,
        nickname: 'Tester'
      });

    expect(response.status).toBe(400);
    expect(response.body.result).toBe(false);
    expect(response.body.message).toBe('허용되지 않은 이메일 도메인입니다. naver.com, kakao.com, nate.com 도메인만 허용됩니다.');
  });

  it('should fail if username is already taken', async () => {
    isUsernameTaken.mockResolvedValue(true);

    const response = await request(app)
      .post('/register')
      .send({
        username: 'existinguser',
        password: 'Password1!',
        email: 'test@naver.com',
        age: 25,
        nickname: 'Tester'
      });

    expect(response.status).toBe(400);
    expect(response.body.result).toBe(false);
    expect(response.body.message).toBe('이미 사용 중인 사용자 이름입니다.');
    expect(isUsernameTaken).toHaveBeenCalledWith('existinguser');
  });

  it('should fail if email is already taken', async () => {
    isUsernameTaken.mockResolvedValue(false);
    isEmailTaken.mockResolvedValue(true);

    const response = await request(app)
      .post('/register')
      .send({
        username: 'testuser',
        password: 'Password1!',
        email: 'existing@naver.com',
        age: 25,
        nickname: 'Tester'
      });

    expect(response.status).toBe(400);
    expect(response.body.result).toBe(false);
    expect(response.body.message).toBe('이미 사용 중인 이메일입니다.');
    expect(isEmailTaken).toHaveBeenCalledWith('existing@naver.com');
  });

  it('should handle server errors gracefully', async () => {
    isUsernameTaken.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/register')
      .send({
        username: 'testuser',
        password: 'Password1!',
        email: 'test@naver.com',
        age: 25,
        nickname: 'Tester'
      });

    expect(response.status).toBe(500);
    expect(response.body.result).toBe(false);
    expect(response.body.message).toBe('서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
  });
});