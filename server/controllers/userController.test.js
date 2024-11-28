const request = require('supertest');
const app = require('../app');
const userController = require('./userController');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { isUsernameTaken, isEmailTaken } = require('../utils/userUtils');
const { User } = require('../models/userModel');

// server/controllers/userController.test.js


jest.mock('../models/userModel');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../utils/userUtils');

app.post('/register', userController.registerUser);
app.post('/login', userController.login);

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

  it('should login successfully with correct credentials', async () => {
    const mockUser = {
      _id: 'userId',
      username: 'testuser',
      password: 'hashedPassword',
      email: 'test@naver.com',
      createdAt: new Date(),
      profiles: [
        {
          _id: 'profileId',
          nickname: 'Tester',
          userImage: 'imageUrl',
          birthdate: '1995-01-01',
        },
      ],
      isDeleted: false,
    };

    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('token');

    const response = await request(app)
      .post('/login')
      .send({
        username: 'testuser',
        password: 'Password1!',
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('로그인 성공');
    expect(response.body.token).toBe('token');
    expect(response.body.user).toEqual({
      id: 'userId',
      username: 'testuser',
      email: 'test@naver.com',
      createdAt: mockUser.createdAt.toISOString(),
      profiles: [
        {
          id: 'profileId',
          nickname: 'Tester',
          userImage: 'imageUrl',
          birthdate: '1995-01-01',
        },
      ],
    });
    expect(User.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false });
    expect(bcrypt.compare).toHaveBeenCalledWith('Password1!', 'hashedPassword');
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 'userId', username: 'testuser' },
      SECRET_KEY,
      { expiresIn: '1d' }
    );
  });

  it('should fail login if username does not exist', async () => {
    userModel.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post('/login')
      .send({
        username: 'nonexistentuser',
        password: 'Password1!',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('아이디 또는 비밀번호가 잘못되었습니다.');
    expect(userModel.findOne).toHaveBeenCalledWith({ username: 'nonexistentuser', isDeleted: false });
  });

  it('should fail login if password is incorrect', async () => {
    const mockUser = {
      _id: 'userId',
      username: 'testuser',
      password: 'hashedPassword',
      isDeleted: false,
    };

    userModel.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    const response = await request(app)
      .post('/login')
      .send({
        username: 'testuser',
        password: 'WrongPassword1!',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('아이디 또는 비밀번호가 잘못되었습니다.');
    expect(bcrypt.compare).toHaveBeenCalledWith('WrongPassword1!', 'hashedPassword');
  });

  it('should fail login if user is deleted', async () => {
    userModel.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post('/login')
      .send({
        username: 'deleteduser',
        password: 'Password1!',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('아이디 또는 비밀번호가 잘못되었습니다.');
  });

  it('should handle server errors gracefully', async () => {
    userModel.findOne.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/login')
      .send({
        username: 'testuser',
        password: 'Password1!',
      });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Database error');
  });it('should login successfully with correct credentials', async () => {
    const mockUser = {
      _id: 'userId',
      username: 'testuser',
      password: 'hashedPassword',
      email: 'test@naver.com',
      createdAt: new Date(),
      profiles: [
        {
          _id: 'profileId',
          nickname: 'Tester',
          userImage: 'imageUrl',
          birthdate: '1995-01-01',
        },
      ],
      isDeleted: false,
    };

    userModel.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('token');

    const response = await request(app)
      .post('/login')
      .send({
        username: 'testuser',
        password: 'Password1!',
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('로그인 성공');
    expect(response.body.token).toBe('token');
    expect(response.body.user).toEqual({
      id: 'userId',
      username: 'testuser',
      email: 'test@naver.com',
      createdAt: mockUser.createdAt.toISOString(),
      profiles: [
        {
          id: 'profileId',
          nickname: 'Tester',
          userImage: 'imageUrl',
          birthdate: '1995-01-01',
        },
      ],
    });
    expect(userModel.findOne).toHaveBeenCalledWith({ username: 'testuser', isDeleted: false });
    expect(bcrypt.compare).toHaveBeenCalledWith('Password1!', 'hashedPassword');
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 'userId', username: 'testuser' },
      SECRET_KEY,
      { expiresIn: '1d' }
    );
  });

  it('should fail login if username does not exist', async () => {
    userModel.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post('/login')
      .send({
        username: 'nonexistentuser',
        password: 'Password1!',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('아이디 또는 비밀번호가 잘못되었습니다.');
    expect(userModel.findOne).toHaveBeenCalledWith({ username: 'nonexistentuser', isDeleted: false });
  });

  it('should fail login if password is incorrect', async () => {
    const mockUser = {
      _id: 'userId',
      username: 'testuser',
      password: 'hashedPassword',
      isDeleted: false,
    };

    userModel.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    const response = await request(app)
      .post('/login')
      .send({
        username: 'testuser',
        password: 'WrongPassword1!',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('아이디 또는 비밀번호가 잘못되었습니다.');
    expect(bcrypt.compare).toHaveBeenCalledWith('WrongPassword1!', 'hashedPassword');
  });

  it('should fail login if user is deleted', async () => {
    userModel.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post('/login')
      .send({
        username: 'deleteduser',
        password: 'Password1!',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('아이디 또는 비밀번호가 잘못되었습니다.');
  });

  it('should handle server errors gracefully', async () => {
    userModel.findOne.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/login')
      .send({
        username: 'testuser',
        password: 'Password1!',
      });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Database error');
  });
});