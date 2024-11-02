// server/user/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

// 게시물 전체 조회 또는 카테고리별 조회
router.get('/posts', postController.getPosts);

// 특정 게시물 조회
router.get('/posts:id', postController.getPostById);

// 게시물 작성
router.post('/posts', postController.createPost);

// 게시물 수정
router.put('/posts:id', postController.updatePost);

// 게시물 삭제
router.delete('/posts:id', postController.deleteost);

module.exports = router;