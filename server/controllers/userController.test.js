const request = require('supertest');
const app = require('../app');
const userController = require('./userController');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { isUsernameTaken, isEmailTaken } = require('../utils/userUtils');
const { User } = require('../models/userModel');
const SECRET_KEY = process.env.SECRET_KEY;

// server/controllers/userController.test.js


jest.mock('../models/userModel');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../utils/userUtils');

app.post('/register', userController.registerUser);
app.post('/login', userController.login);

describe('register', () => {
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

describe('login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login successfully with valid credentials', async () => {
    const mockUser = {
      _id: 'userId123',
      username: 'testuser',
      email: 'test@naver.com',
      password: 'hashedPassword',
      createdAt: new Date().toISOString(), // 문자열로 변경
      profiles: [
        {
          _id: 'profileId123',
          nickname: 'Tester',
          profileImage: 'http://example.com/image.jpg',
          birthdate: '1990-01-01',
        },
      ],
      isDeleted: false,
    };

    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('dummyToken');

    const response = await request(app)
      .post('/login')
      .send({
        username: 'testuser',
        password: 'Password1!',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: '로그인 성공',
      token: 'dummyToken',
      user: {
        id: 'userId123',
        username: 'testuser',
        email: 'test@naver.com',
        createdAt: mockUser.createdAt, // 문자열로 비교
        profiles: [
          {
            id: 'profileId123',
            nickname: 'Tester',
            profileImage: 'http://example.com/image.jpg',
            birthdate: '1990-01-01',
          },
        ],
      },
    });
    expect(User.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false });
    expect(bcrypt.compare).toHaveBeenCalledWith('Password1!', 'hashedPassword');
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 'userId123', username: 'testuser' },
      SECRET_KEY,
      { expiresIn: '1d' }
    );
  });
});