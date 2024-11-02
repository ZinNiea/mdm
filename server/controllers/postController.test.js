const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Post = require('../models/postModel');
const postController = require('./postController');

const app = express();
app.use(express.json());
app.get('/posts', postController.getPosts);

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