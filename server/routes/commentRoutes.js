// server/routes/commentRoutes.js
// #swagger.tags = ['Comments']
const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/commentController');

// 댓글 추가 (대댓글 포함)
router.post('/posts/:postId/comments', commentsController.addComment);

// 댓글 목록 조회 (대댓글 포함)
router.get('/posts/:postId/comments', commentsController.getComments);

// 댓글 삭제
router.delete('/:commentId', commentsController.deleteComment);

router.post('/:commentId/like', commentsController.toggleCommentLike);

router.post('/:commentId/report', commentsController.reportComment);

module.exports = router;