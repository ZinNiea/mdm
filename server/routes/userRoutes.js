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

// router.post('/:userId/profiles/:profileId/interests', userController.addInterest);
// router.put('/:userId/profiles/:profileId/interests/:interestId', userController.updateInterest);
// router.get('/:userId/profiles/:profileId/interests', userController.getInterests);

module.exports = router;