// server/user/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// AWS S3 업로드 미들웨어 가져오기
const { upload } = require('../middlewares/uploadMiddleware');

router.post('/register', upload.single('profileImage'), userController.registerUser);
router.post('/login', userController.login);
router.delete('/:userId/delete', userController.deleteUser);
router.put('/:userId/profile', userController.addProfile);
router.get('/subcategories/:mainCategory', userController.getSubCategories);

// 특정 프로필의 관심사 조회 라우트 추가
router.get('/profiles/:profileId/interests', userController.getInterests);

// 특정 프로필에 관심사 추가 라우트 추가
router.post('/profiles/:profileId/interests', userController.addInterest);

// router.post('/:userId/profiles/:profileId/interests', userController.addInterest);
// router.put('/:userId/profiles/:profileId/interests/:interestId', userController.updateInterest);
// router.get('/:userId/profiles/:profileId/interests', userController.getInterests);

module.exports = router;