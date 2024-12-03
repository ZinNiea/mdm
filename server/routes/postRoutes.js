// server/user/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const commentsController = require('../controllers/commentController');
const { upload } = require('../middlewares/uploadMiddleware');

// 게시물 전체 조회 또는 카테고리별 조회
router.get('/posts', postController.getPosts);

// 특정 게시물 조회
router.get('/posts/:postId', postController.getPostById);

// 게시물 작성 (최대 5장까지 이미지 업로드 허용)
router.post('/posts', upload.array('images', 5), postController.createPost);

// 게시물 수정
router.put('/posts/:postId', upload.array('images', 5), postController.updatePost);

// 게시물 삭제
router.delete('/posts/:postId', postController.deletePost);

// 게시물 신고
router.post('/posts/:postId/report', postController.reportPost);

// 좋아요 실행/취소
router.post('/posts/:postId/likes', postController.toggleLike);




/* 댓글 관련 라우터 */
// 댓글 추가 (대댓글 포함)
router.post('/posts/:postId/comments', commentsController.addComment);

// 댓글 목록 조회 (대댓글 포함)
router.get('/posts/:postId/comments', commentsController.getComments);

// 댓글 삭제
router.delete('/posts/:postId/comments/:commentId', commentsController.deleteComment);

router.post('/posts/:postId/comments/:commentId/likes', commentsController.toggleCommentLike);

module.exports = router;