// server/user/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const { upload, IMAGE_TYPES } = require('../middlewares/uploadMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');

// 게시물 전체 조회 또는 카테고리별 조회
router.get('/posts', postController.getPosts);

// 특정 게시물 조회
router.get('/posts/:postId', authenticateToken, postController.getPostById);

// 게시물 작성 (최대 5장까지 이미지 업로드 허용)
router.post('/posts', upload(IMAGE_TYPES.POST).array('images', 5), postController.createPost);

// 게시물 수정
router.put('/posts/:postId', upload(IMAGE_TYPES.POST).array('images', 5), postController.updatePost);

// 게시물 삭제
router.delete('/posts/:postId', postController.deletePost);

// 게시물 신고
router.post('/posts/:postId/report', postController.reportPost);

// 좋아요 실행/취소
router.post('/posts/:postId/likes', postController.toggleLike);

// 북마크 실행/취소
router.post('/posts/:postId/bookmarks', postController.toggleBookmark);

// 북마크 게시물 조회
router.get('/users/:userId/bookmarks', postController.getBookmarkedPosts);



/* 댓글 관련 라우터 */
// 댓글 추가 (대댓글 포함)
router.post('/posts/:postId/comments', commentController.addComment);

// 댓글 목록 조회 (대댓글 포함)
router.get('/posts/:postId/comments', commentController.getComments);

// 댓글 삭제
router.delete('/posts/:postId/comments/:commentId', commentController.deleteComment);

// 댓글 좋아요 표시/취소
router.post('/posts/:postId/comments/:commentId/likes', commentController.toggleCommentLike);

// 댓글 신고
router.post('/posts/:postId/comments/:commentId/report', commentController.reportComment);



/* 새로운 라우트: 특정 프로필의 게시글 목록 조회 */
router.get('/posts/profile/:profileId', postController.getPostsByProfile);

// 실시간 인기 키워드 랭킹 조회
router.get('/popular-keywords', postController.getPopularKeywords);

module.exports = router;