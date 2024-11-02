require('dotenv').config();

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const userController = require('./userController');
const userSchema = require('../models/userModel');

const app = express();
app.use(express.json());
app.delete('/user', userController.deleteUser);

jest.mock('../models/userModel');
const SECRET_KEY = process.env.SECRET_KEY;

describe('DELETE /user', () => {
    let token;

    beforeEach(() => {
        token = jwt.sign({ id: 'testUserId' }, SECRET_KEY, { expiresIn: '1h' });
    });

    it('should return 401 if no token is provided', async () => {
        const res = await request(app).delete('/user');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ result: false, message: '인증 토큰이 필요합니다.' });
    });

    it('should return 401 if token is invalid', async () => {
        const res = await request(app)
            .delete('/user')
            .set('Authorization', 'Bearer invalidtoken');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ result: false, message: '유효하지 않은 토큰입니다.' });
    });

    it('should return 404 if user is not found', async () => {
        userSchema.findByIdAndDelete.mockResolvedValue(null);
        const res = await request(app)
            .delete('/user')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ result: false, message: '사용자를 찾을 수 없습니다.' });
    });

    it('should return 200 if user is successfully deleted', async () => {
        userSchema.findByIdAndDelete.mockResolvedValue({ _id: 'testUserId' });
        const res = await request(app)
            .delete('/user')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ result: true, message: '회원 탈퇴가 성공적으로 완료되었습니다.' });
    });

    it('should return 500 if server error occurs', async () => {
        userSchema.findByIdAndDelete.mockRejectedValue(new Error('Server error'));
        const res = await request(app)
            .delete('/user')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ result: false, message: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.' });
    });
});