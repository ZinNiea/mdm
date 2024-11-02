const request = require('supertest');
const express = require('express');
const userRoutes = require('./userRoutes');
const userController = require('../controllers/userController');

const app = express();
app.use(express.json());
app.use('/user', userRoutes);

jest.mock('../controllers/userController');

describe('User Routes', () => {
    describe('POST /user/register', () => {
        it('should call userController.signup', async () => {
            userController.signup.mockImplementation((req, res) => res.status(201).send());

            const response = await request(app)
                .post('/user/signup')
                .send({ username: 'testuser', password: 'testpassword' });

            expect(response.status).toBe(201);
            expect(userController.signup).toHaveBeenCalled();
        });

        const app = express();
        app.use(express.json());
        app.use('/user', userRoutes);

        jest.mock('../controllers/userController');

        describe('User Routes', () => {
            describe('POST /user/signup', () => {
                it('should call userController.signup', async () => {
                    userController.signup.mockImplementation((req, res) => res.status(201).send());

                    const response = await request(app)
                        .post('/user/signup')
                        .send({ username: 'testuser', password: 'testpassword' });

                    expect(response.status).toBe(201);
                    expect(userController.signup).toHaveBeenCalled();
                });
            });

            describe('POST /user/login', () => {
                it('should call userController.login', async () => {
                    userController.login.mockImplementation((req, res) => res.status(200).send());

                    const response = await request(app)
                        .post('/user/login')
                        .send({ username: 'testuser', password: 'testpassword' });

                    expect(response.status).toBe(200);
                    expect(userController.login).toHaveBeenCalled();
                });
            });

            describe('DELETE /user/delete', () => {
                it('should call userController.deleteUser', async () => {
                    userController.deleteUser.mockImplementation((req, res) => res.status(200).send());

                    const response = await request(app)
                        .delete('/user/delete')
                        .send({ userId: '12345' });

                    expect(response.status).toBe(200);
                    expect(userController.deleteUser).toHaveBeenCalled();
                });
            });
        });
    });
});