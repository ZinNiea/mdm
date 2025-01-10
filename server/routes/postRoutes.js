// server/user/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const { upload, IMAGE_TYPES } = require('../middlewares/uploadMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: 게시물 전체 조회 또는 카테고리별 조회
 *     tags: [Posts]
 *   post:
 *     summary: 게시물 작성
 *     tags: [Posts]
 */
router.get('/posts', postController.getPosts);
router.post('/posts', upload(IMAGE_TYPES.POST).array('images', 5), postController.createPost);

/**
 * @swagger
 * /posts/{postId}:
 *   get:
 *     summary: 특정 게시물 조회
 *     tags: [Posts]
 *   put:
 *     summary: 게시물 수정
 *     tags: [Posts]
 *   delete:
 *     summary: 게시물 삭제
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 삭제 완료
 *       404:
 *         description: 게시물을 찾을 수 없음
 */
router.get('/posts/:postId', authenticateToken, postController.getPostById);
router.put('/posts/:postId', upload(IMAGE_TYPES.POST).array('images', 5), postController.updatePost);
router.delete('/posts/:postId', postController.deletePost);

/**
 * @swagger
 * /posts/{postId}/report:
 *   post:
 *     summary: 게시물 신고
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: 신고 사유
 *       required: false
 *     responses:
 *       200:
 *         description: 신고 완료
 *       404:
 *         description: 게시물을 찾을 수 없음
 */
router.post('/posts/:postId/report', postController.reportPost);

/**
 * @swagger
 * /posts/{postId}/likes:
 *   post:
 *     summary: 좋아요 실행/취소
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 좋아요 변경 완료
 *       404:
 *         description: 게시물을 찾을 수 없음
 */
router.post('/posts/:postId/likes', postController.toggleLike);

/**
 * @swagger
 * /posts/{postId}/bookmarks:
 *   post:
 *     summary: 북마크 실행/취소
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 북마크 변경 완료
 *       404:
 *         description: 게시물을 찾을 수 없음
 */
router.post('/posts/:postId/bookmarks', postController.toggleBookmark);

/**
 * @swagger
 * /users/{userId}/bookmarks:
 *   get:
 *     summary: 북마크 게시물 조회
 *     tags: [Posts]
 */
router.get('/users/:userId/bookmarks', postController.getBookmarkedPosts);

/* 댓글 관련 라우터 */
/**
 * @swagger
 * /posts/{postId}/comments:
 *   post:
 *     summary: 댓글 추가
 *     tags: [Comments]
 *   get:
 *     summary: 댓글 목록 조회
 *     tags: [Comments]
 */
router.post('/posts/:postId/comments', commentController.addComment);
router.get('/posts/:postId/comments', commentController.getComments);

/**
 * @swagger
 * /posts/{postId}/comments/{commentId}:
 *   delete:
 *     summary: 댓글 삭제
 *     tags: [Comments]
 */
router.delete('/posts/:postId/comments/:commentId', commentController.deleteComment);

/**
 * @swagger
 * /posts/{postId}/comments/{commentId}/likes:
 *   post:
 *     summary: 댓글 좋아요 표시/취소
 *     tags: [Comments]
 */
router.post('/posts/:postId/comments/:commentId/likes', commentController.toggleCommentLike);

/**
 * @swagger
 * /posts/{postId}/comments/{commentId}/report:
 *   post:
 *     summary: 댓글 신고
 *     tags: [Comments]
 */
router.post('/posts/:postId/comments/:commentId/report', commentController.reportComment);

/* 새로운 라우트: 특정 프로필의 게시글 목록 조회 */
/**
 * @swagger
 * /posts/profile/{profileId}:
 *   get:
 *     summary: 특정 프로필의 게시글 목록 조회
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 프로필의 고유 식별자
 *     responses:
 *       200:
 *         description: 게시글 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       404:
 *         description: 프로필을 찾을 수 없음
 */
router.get('/posts/profile/:profileId', postController.getPostsByProfile);

module.exports = router;