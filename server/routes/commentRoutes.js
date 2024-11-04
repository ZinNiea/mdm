// routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/commentController');

// 댓글 추가 (대댓글 포함)
router.post('/posts/:postId/comments', commentsController.addComment);

// 댓글 목록 조회 (대댓글 포함)
router.get('/posts/:postId/comments', commentsController.getComments);

// 댓글 삭제
router.delete('/comments/:commentId', commentsController.deleteComment);

module.exports = router;