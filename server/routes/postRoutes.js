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
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 게시물의 카테고리 필터링
 *     responses:
 *       200:
 *         description: 게시물을 성공적으로 조회하였습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   content:
 *                     type: string
 *                   authorId:
 *                     type: string
 *                   authorNickname:
 *                     type: string
 *                   authorImage:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                   likesCount:
 *                     type: integer
 *                   commentCount:
 *                     type: integer
 *                   likeStatus:
 *                     type: boolean
 *                   bookmarkCount:
 *                     type: integer
 *                   bookmarkStatus:
 *                     type: boolean
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *       400:
 *         description: 잘못된 쿼리 파라미터가 제공되었습니다.
 *       401:
 *         description: 인증이 필요합니다. 유효한 인증 토큰을 제공해야 합니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 *   post:
 *     summary: 게시물 작성
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: 게시물의 제목
 *               content:
 *                 type: string
 *                 description: 게시물의 내용
 *               images:
 *                 type: array
 *                 description: 업로드할 이미지 파일들 (최대 5개)
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: 게시물이 성공적으로 작성되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 postId:
 *                   type: string
 *                   description: 생성된 게시물의 고유 ID
 *       400:
 *         description: 요청 데이터가 잘못되었습니다. 필수 필드가 누락되었거나 형식이 올바르지 않습니다.
 *       401:
 *         description: 인증이 필요합니다. 유효한 인증 토큰을 제공해야 합니다.
 *       413:
 *         description: 업로드된 파일의 용량이 너무 큽니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.get('/posts', postController.getPosts);
router.post('/posts', authenticateToken, upload(IMAGE_TYPES.POST).array('images', 5), postController.createPost);

/**
 * @swagger
 * /posts/{postId}:
 *   get:
 *     summary: 특정 게시물 조회
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 게시물의 고유 ID
 *     responses:
 *       200:
 *         description: 지정된 게시물을 성공적으로 조회하였습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     postId:
 *                       type: string
 *                     content:
 *                       type: string
 *                     authorId:
 *                       type: string
 *                     authorNickname:
 *                       type: string
 *                     authorImage:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                     likesCount:
 *                       type: integer
 *                     likeStatus:
 *                       type: boolean
 *                     commentCount:
 *                       type: integer
 *                     bookmarkCount:
 *                       type: integer
 *                     bookmarkStatus:
 *                       type: boolean
 *       400:
 *         description: 잘못된 postId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다. 유효한 인증 토큰을 제공해야 합니다.
 *       404:
 *         description: 지정된 게시물을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 *   put:
 *     summary: 게시물 수정
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 수정할 게시물의 고유 ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: 수정할 제목
 *               content:
 *                 type: string
 *                 description: 수정할 내용
 *               images:
 *                 type: array
 *                 description: 수정할 이미지 파일들 (최대 5개)
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: 게시물이 성공적으로 수정되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 postId:
 *                   type: string
 *                   description: 수정된 게시물의 고유 ID
 *       400:
 *         description: 요청 데이터가 잘못되었습니다.
 *       401:
 *         description: 인증이 필요합니다. 유효한 인증 토큰을 제공해야 합니다.
 *       403:
 *         description: 게시물 수정 권한이 없습니다.
 *       404:
 *         description: 수정할 게시물을 찾을 수 없습니다.
 *       413:
 *         description: 업로드된 파일의 용량이 너무 큽니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 *   delete:
 *     summary: 게시물 삭제
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 게시물의 고유 ID
 *     responses:
 *       200:
*         description: 게시물이 성공적으로 삭제되었습니다.
 *       400:
 *         description: 잘못된 postId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다. 유효한 인증 토큰을 제공해야 합니다.
 *       403:
 *         description: 게시물 삭제 권한이 없습니다.
 *       404:
 *         description: 삭제할 게시물을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.get('/posts/:postId', authenticateToken, postController.getPostById);
router.put('/posts/:postId', authenticateToken, upload(IMAGE_TYPES.POST).array('images', 5), postController.updatePost);
router.delete('/posts/:postId', authenticateToken, postController.deletePost);

/**
 * @swagger
 * /posts/{postId}/report:
 *   post:
 *     summary: 게시물 신고
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 신고할 게시물의 고유 ID
 *     requestBody:
 *       description: 신고 사유
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 신고 사유
 *               details:
 *                 type: string
 *                 description: 추가 신고 내용
 *     responses:
 *       200:
 *         description: 게시물이 성공적으로 신고되었습니다.
 *       400:
 *         description: 요청 데이터가 잘못되었습니다. 필수 필드가 누락되었거나 형식이 올바르지 않습니다.
 *       401:
 *         description: 인증이 필요합니다. 유효한 인증 토큰을 제공해야 합니다.
 *       404:
 *         description: 신고할 게시물을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.post('/posts/:postId/report', authenticateToken, postController.reportPost);

/**
 * @swagger
 * /posts/{postId}/likes:
 *   post:
 *     summary: 좋아요 실행/취소
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 좋아요를 실행/취소할 게시물의 고유 ID
 *     responses:
 *       200:
 *         description: 좋아요 상태가 성공적으로 변경되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liked:
 *                   type: boolean
 *                   description: 현재 좋아요 상태
 *       400:
 *         description: 잘못된 postId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다. 유효한 인증 토큰을 제공해야 합니다.
 *       404:
 *         description: 좋아요를 실행/취소할 게시물을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.post('/posts/:postId/likes', authenticateToken, postController.toggleLike);

/**
 * @swagger
 * /posts/{postId}/bookmarks:
 *   post:
 *     summary: 북마크 실행/취소
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 북마크를 실행/취소할 게시물의 고유 ID
 *     responses:
 *       200:
 *         description: 북마크 상태가 성공적으로 변경되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookmarked:
 *                   type: boolean
 *                   description: 현재 북마크 상태
 *       400:
 *         description: 잘못된 postId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다. 유효한 인증 토큰을 제공해야 합니다.
 *       404:
 *         description: 북마크를 실행/취소할 게시물을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.post('/posts/:postId/bookmarks', authenticateToken, postController.toggleBookmark);

/**
 * @swagger
 * /users/{userId}/bookmarks:
 *   get:
 *     summary: 북마크 게시물 조회
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시물을 북마크한 사용자의 고유 ID
 *     responses:
 *       200:
 *         description: 북마크된 게시물 목록을 성공적으로 조회하였습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       400:
 *         description: 잘못된 userId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다. 유효한 인증 토큰을 제공해야 합니다.
 *       404:
 *         description: 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.get('/users/:userId/bookmarks', authenticateToken, postController.getBookmarkedPosts);

/* 댓글 관련 라우터 */
/**
 * @swagger
 * /posts/{postId}/comments:
 *   post:
 *     summary: 댓글 추가
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 댓글을 추가할 게시물의 고유 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: 댓글 내용
 *     responses:
 *       201:
 *         description: 댓글이 성공적으로 추가되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 commentId:
 *                   type: string
 *                   description: 생성된 댓글의 고유 ID
 *       400:
 *         description: 요청 데이터가 잘못되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 댓글을 추가할 게시물을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 *   get:
 *     summary: 댓글 목록 조회
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 댓글을 조회할 게시물의 고유 ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 한 페이지당 댓글 수
 *     responses:
 *       200:
 *         description: 댓글 목록을 성공적으로 조회하였습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       400:
 *         description: 잘못된 요청 파라미터가 제공되었습니다.
 *       404:
 *         description: 댓글을 조회할 게시물을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.post('/posts/:postId/comments', authenticateToken, commentController.addComment);
router.get('/posts/:postId/comments', commentController.getComments);

/**
 * @swagger
 * /posts/{postId}/comments/{commentId}:
 *   delete:
 *     summary: 댓글 삭제
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 댓글이 속한 게시물의 고유 ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 댓글의 고유 ID
 *     responses:
 *       200:
 *         description: 댓글이 성공적으로 삭제되었습니다.
 *       400:
 *         description: 잘못된 요청 파라미터가 제공되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       403:
 *         description: 댓글 삭제 권한이 없습니다.
 *       404:
 *         description: 삭제할 댓글을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.delete('/posts/:postId/comments/:commentId', authenticateToken, commentController.deleteComment);

/**
 * @swagger
 * /posts/{postId}/comments/{commentId}/likes:
 *   post:
 *     summary: 댓글 좋아요 표시/취소
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 댓글이 속한 게시물의 고유 ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 좋아요를 표시/취소할 댓글의 고유 ID
 *     responses:
 *       200:
 *         description: 댓글 좋아요 상태가 성공적으로 변경되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liked:
 *                   type: boolean
 *                   description: 현재 좋아요 상태
 *       400:
 *         description: 잘못된 요청 파라미터가 제공되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 좋아요를 표시/취소할 댓글을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.post('/posts/:postId/comments/:commentId/likes', authenticateToken, commentController.toggleCommentLike);

/**
 * @swagger
 * /posts/{postId}/comments/{commentId}/report:
 *   post:
 *     summary: 댓글 신고
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 신고할 댓글이 속한 게시물의 고유 ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 신고할 댓글의 고유 ID
 *     requestBody:
 *       description: 신고 사유
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 신고 사유
 *               details:
 *                 type: string
 *                 description: 추가 신고 내용
 *     responses:
 *       200:
 *         description: 댓글이 성공적으로 신고되었습니다.
 *       400:
 *         description: 요청 데이터가 잘못되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 신고할 댓글을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.post('/posts/:postId/comments/:commentId/report', authenticateToken, commentController.reportComment);

/* 새로운 라우트: 특정 프로필의 게시글 목록 조회 */
/**
 * @swagger
 * /posts/profile/{profileId}:
 *   get:
 *     summary: 특정 프로필의 게시글 목록 조회
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 프로필의 고유 식별자
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 한 페이지당 게시글 수
 *     responses:
 *       200:
 *         description: 특정 프로필의 게시글 목록을 성공적으로 조회하였습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       400:
 *         description: 잘못된 요청 파라미터가 제공되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 조회할 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.get('/posts/profile/:profileId', authenticateToken, postController.getPostsByProfile);

module.exports = router;