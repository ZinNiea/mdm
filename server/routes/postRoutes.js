// server/user/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { upload } = require('../middlewares/uploadMiddleware');

// 게시물 전체 조회 또는 카테고리별 조회
router.get('/posts', postController.getPosts);

// 특정 게시물 조회
router.get('/posts/:id', postController.getPostById);

// 게시물 작성 (최대 5장까지 이미지 업로드 허용)
router.post('/posts', upload.array('images', 5), postController.createPost);

// 게시물 수정
router.put('/posts/:id', postController.updatePost);

// 게시물 삭제
router.delete('/posts/:id', postController.deletePost);

// 게시물 신고
router.post('/posts/:id/report', postController.reportPost);

// 좋아요/좋아요 취소
router.post('/posts/:id/like', postController.toggleLike);

module.exports = router;