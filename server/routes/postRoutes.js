// server/user/postRoutes.js
// #swagger.tags = ['Posts']
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const { upload, IMAGE_TYPES } = require('../middlewares/uploadMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/posts', postController.getPosts);
router.post('/posts', authenticateToken, upload(IMAGE_TYPES.POST).array('images', 5), postController.createPost);
router.get('/', postController.getPosts);
router.post('/', authenticateToken, upload(IMAGE_TYPES.POST).array('images', 5), postController.createPost);

router.get('/posts/:postId', authenticateToken, postController.getPostById);
router.put('/posts/:postId', authenticateToken, upload(IMAGE_TYPES.POST).array('images', 5), postController.updatePost);
router.delete('/posts/:postId', authenticateToken, postController.deletePost);
router.get('/:postId', authenticateToken, postController.getPostById);
router.put('/:postId', authenticateToken, upload(IMAGE_TYPES.POST).array('images', 5), postController.updatePost);
router.delete('/:postId', authenticateToken, postController.deletePost);

router.post('/posts/:postId/report', authenticateToken, postController.reportPost);
router.post('/:postId/report', authenticateToken, postController.reportPost);

router.post('/posts/:postId/likes', authenticateToken, postController.toggleLike);
router.post('/:postId/likes', authenticateToken, postController.toggleLike);

router.post('/posts/:postId/bookmarks', authenticateToken, postController.toggleBookmark);
router.post('/:postId/bookmarks', authenticateToken, postController.toggleBookmark);

//!< profiles 모듈로 이동하였고, 추후 삭제 예정
router.get('/users/:userId/bookmarks', authenticateToken, postController.getBookmarkedPosts);

router.post('/posts/:postId/comments', authenticateToken, commentController.addComment);
router.get('/posts/:postId/comments', commentController.getComments);
router.post('/:postId/comments', authenticateToken, commentController.addComment);
router.get('/:postId/comments', commentController.getComments);

router.delete('/posts/:postId/comments/:commentId', authenticateToken, commentController.deleteComment);
router.delete('/:postId/comments/:commentId', authenticateToken, commentController.deleteComment);

//TODO: comments 모듈로 이동할지 검토 예정
router.post('/posts/:postId/comments/:commentId/likes', authenticateToken, commentController.toggleCommentLike);
router.post('/:postId/comments/:commentId/likes', authenticateToken, commentController.toggleCommentLike);

//TODO: comments 모듈로 이동할지 검토 예정
router.post('/posts/:postId/comments/:commentId/report', authenticateToken, commentController.reportComment);
router.post('/:postId/comments/:commentId/report', authenticateToken, commentController.reportComment);

router.get('/posts/profile/:profileId', authenticateToken, postController.getPostsByProfile);
router.get('/profile/:profileId', authenticateToken, postController.getPostsByProfile);

router.get('/popular-keywords', postController.getSearchRanking);
// router.get('/popular-keywords', postController.getPopularKeywords);

module.exports = router;