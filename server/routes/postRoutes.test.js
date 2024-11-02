const request = require('supertest');
const express = require('express');
const postRoutes = require('./postRoutes');
const postController = require('../controllers/postController');

const app = express();
app.use(express.json());
app.use('/post', postRoutes);

jest.mock('../controllers/postController');

describe('GET /post/posts', () => {
    it('should return all posts', async () => {
        const mockPosts = [
            { id: 1, title: 'Post 1', content: 'Content 1' },
            { id: 2, title: 'Post 2', content: 'Content 2' },
        ];
        postController.getPosts.mockImplementation((req, res) => {
            res.status(200).json(mockPosts);
        });

        const response = await request(app).get('/api/posts');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockPosts);
    });
});