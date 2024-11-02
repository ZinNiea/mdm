const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Post = require('../models/postModel');
const postController = require('./postController');

const app = express();
app.use(express.json());
app.get('/posts', postController.getPosts);
app.post('/posts', postController.createPost);

describe('GET /posts', () => {
    let token;

    beforeAll(async () => {
        // Connect to a test database
        const url = 'mongodb+srv://p04u:VpJL4ftrjy7RbWO6@cluster0.0nr56.mongodb.net/';
        // const url = process.env.MONGO_URL;
        await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

        // Create a test user and generate a token
        const user = { id: 'testUserId', userName: 'testUser', email: 'test@example.com' };
        token = jwt.sign(user, 'your_secret_key');
    });

    afterAll(async () => {
        // Close the database connection
        await mongoose.connection.close();
    });

    it('should return all posts', async () => {
        const response = await request(app)
            .get('/posts')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return posts filtered by category', async () => {
        const category = 1; // Example category
        const response = await request(app)
            .get(`/posts?category=${category}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        response.body.data.forEach(post => {
            expect(post.category).toBe(category);
        });
    });

    it('should return posts filtered by search term', async () => {
        const search = 'example'; // Example search term
        const response = await request(app)
            .get(`/posts?search=${search}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        response.body.data.forEach(post => {
            expect(post.content).toMatch(new RegExp(search, 'i'));
        });
    });

    it('should handle errors gracefully', async () => {
        // Simulate an error by disconnecting the database
        await mongoose.connection.close();

        const response = await request(app)
            .get('/posts')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);

        // Reconnect the database for other tests
        const url = 'mongodb+srv://p04u:VpJL4ftrjy7RbWO6@cluster0.0nr56.mongodb.net/';
        await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    });
});

// 게시물 작성
describe('POST /posts', () => {
    let token;

    beforeAll(async () => {
        // Connect to a test database
        const url = 'mongodb+srv://p04u:VpJL4ftrjy7RbWO6@cluster0.0nr56.mongodb.net/test';
        await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

        // Create a test user and generate a token
        const user = { id: 'testUserId', userName: 'testUser', email: 'test@example.com' };
        token = jwt.sign(user, 'your_secret_key');
    });

    afterAll(async () => {
        // Close the database connection
        await mongoose.connection.close();
    });

    it('should create a new post', async () => {
        const newPost = {
            content: 'This is a test post',
            images: ['image1.jpg', 'image2.jpg'],
            category: Post.CATEGORY.PUBLIC
        };

        const response = await request(app)
            .post('/posts')
            .set('Authorization', `Bearer ${token}`)
            .send(newPost);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('_id');
        expect(response.body.data.content).toBe(newPost.content);
        expect(response.body.data.images).toEqual(newPost.images);
        expect(response.body.data.category).toBe(newPost.category);
    });

    it('should return 401 if no token is provided', async () => {
        const newPost = {
            content: 'This is a test post',
            images: ['image1.jpg', 'image2.jpg'],
            category: Post.CATEGORY.SOME_CATEGORY // Replace with a valid category
        };

        const response = await request(app)
            .post('/posts')
            .send(newPost);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('인증 토큰이 필요합니다.');
    });

    it('should return 400 for invalid category', async () => {
        const newPost = {
            content: 'This is a test post',
            images: ['image1.jpg', 'image2.jpg'],
            category: 999 // Invalid category
        };

        const response = await request(app)
            .post('/posts')
            .set('Authorization', `Bearer ${token}`)
            .send(newPost);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('유효하지 않은 카테고리입니다.');
    });

    it('should return 401 for invalid token', async () => {
        const newPost = {
            content: 'This is a test post',
            images: ['image1.jpg', 'image2.jpg'],
            category: Post.CATEGORY.SOME_CATEGORY // Replace with a valid category
        };

        const response = await request(app)
            .post('/posts')
            .set('Authorization', `Bearer invalidtoken`)
            .send(newPost);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('유효하지 않은 토큰입니다.');
    });
});