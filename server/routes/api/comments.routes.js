// server/routes/api/comments.routes.js
const express = require('express');
const router = express.Router();
const commentsController = require('../../controllers/comment.controller');

// 댓글 추가 (대댓글 포함)
/**
 * @swagger
 * /posts/{postId}/comments:
 *   post:
 *     summary: 댓글 추가 (대댓글 포함)
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시글 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: 댓글 내용
 *               profileId:
 *                 type: string
 *                 description: 댓글 작성자의 프로필 ID
 *               parentId:
 *                 type: string
 *                 description: 부모 댓글 ID (대댓글일 경우)
 *               nickname:
 *                 type: string
 *                 description: 댓글 작성자의 닉네임
 *             required:
 *               - content
 *               - profileId
 *     responses:
 *       201:
 *         description: 댓글이 성공적으로 추가됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 comment:
 *                   $ref: '#/components/schemas/Comment'
 *       500:
 *         description: 댓글 추가 실패
 */
router.post('/posts/:postId/comments', commentsController.addComment);

// 댓글 목록 조회 (대댓글 포함)
router.get('/posts/:postId/comments', commentsController.getComments);

// 댓글 삭제
router.delete('/posts/:postId/comments/:commentId', commentsController.deleteComment);

router.post('/posts/:postId/comments/:commentId/like', commentsController.toggleLike);

module.exports = router;