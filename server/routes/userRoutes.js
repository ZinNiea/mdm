// server/user/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// AWS S3 업로드 미들웨어 가져오기
const { upload } = require('../middlewares/uploadMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/register', upload.single('profileImage'), userController.registerUser);
router.post('/login', userController.login);
router.delete('/:userId/delete', userController.deleteUser);
router.put('/:userId/profile', upload.single('profileImage'), userController.addProfile);
router.get('/subcategories/:mainCategory', userController.getSubCategories);

// 특정 프로필의 관심사 조회 라우트
router.get('/profiles/:profileId/interests', userController.getInterests);

// 특정 프로필에 관심사 추가 라우트
router.post('/profiles/:profileId/interests', userController.addInterest);

// 특정 프로필에 관심사 삭제 라우트
router.delete('/profiles/:profileId/interests/:subCategory', userController.deleteInterest);

// 특정 유저의 프로필 목록 조회 라우트
router.get('/:userId/profile', userController.getUserProfiles);

// 특정 프로필 수정 라우트
router.put('/profiles/:profileId', upload.single('profileImage'), userController.updateProfile);

// 특정 프로필 조회 라우트
router.get('/profiles/:profileId', userController.getProfile);

// 팔로우 기능 라우트
router.post('/users/:userId/follow', userController.followUser);
router.post('/users/:userId/unfollow', userController.unfollowUser);

// 특별한 친구 추가 라우트
router.post('/profiles/:profileId/special-friends', userController.addSpecialFriend);

// 특별한 친구 제거 라우트
router.delete('/profiles/:profileId/special-friends', userController.removeSpecialFriend);

module.exports = router;