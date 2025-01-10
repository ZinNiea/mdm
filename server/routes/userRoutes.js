// server/user/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// AWS S3 업로드 미들웨어 가져오기
const { upload, IMAGE_TYPES } = require('../middlewares/uploadMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: 사용자 등록
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data: // 변경: application/json에서 multipart/form-data로 변경
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               profileImage: // 추가: 프로필 이미지 파일 업로드
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: 회원가입에 성공했습니다.
 */
router.post('/register', upload(IMAGE_TYPES.PROFILE).single('profileImage'), userController.registerUser);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: 사용자 로그인
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인이 성공했습니다.
 */
router.post('/login', userController.login);

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: 사용자 로그아웃
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: 로그아웃 처리
 */
router.post('/logout', userController.logout);

/**
 * @swagger
 * /users/{userId}/delete:
 *   delete:
 *     summary: 사용자 삭제
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 삭제됨
 */
router.delete('/:userId/delete', userController.deleteUser);

/**
 * @swagger
 * /users/{userId}/profile:
 *   post:
 *     summary: 프로필 추가
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data: // 추가: 프로필 이미지 업로드 가능하도록 설정
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: 프로필이 추가됨
 */
router.post('/:userId/profile', upload(IMAGE_TYPES.PROFILE).single('profileImage'), userController.addProfile);

/**
 * @swagger
 * /users/subcategories/{mainCategory}:
 *   get:
 *     summary: 서브카테고리 조회
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: mainCategory
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 서브카테고리 목록
 */
router.get('/subcategories/:mainCategory', userController.getSubCategories);

// 특정 프로필의 관심사 조회 라우트
/**
 * @swagger
 * /users/profiles/{profileId}/interests:
 *   get:
 *     summary: 관심사 조회
 *     tags: [Profiles]
 *   post:
 *     summary: 관심사 추가
 *     tags: [Profiles]
 */
router.get('/profiles/:profileId/interests', userController.getInterests);
router.post('/profiles/:profileId/interests', userController.addInterest);

/**
 * @swagger
 * /users/profiles/{profileId}/interests/{subCategory}:
 *   delete:
 *     summary: 관심사 삭제
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: subCategory
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/profiles/:profileId/interests/:subCategory', userController.deleteInterest);

/**
 * @swagger
 * /users/{userId}/profiles:
 *   get:
 *     summary: 사용자 프로필 목록
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:userId/profile', userController.getUserProfiles);
router.get('/:userId/profiles', userController.getUserProfiles);

/**
 * @swagger
 * /users/profiles/{profileId}:
 *   put:
 *     summary: 프로필 수정
 *     tags: [Profiles]
 *   get:
 *     summary: 특정 프로필 조회
 *     tags: [Profiles]
 *   delete:
 *     summary: 특정 프로필 삭제
 *     tags: [Profiles]
 */
router.put('/profiles/:profileId', upload(IMAGE_TYPES.PROFILE).single('profileImage'), userController.updateProfile);
router.get('/profiles/:profileId', userController.getProfile);
router.delete('/profiles/:profileId', userController.deleteProfile);

/**
 * @swagger
 * /users/profiles:
 *   get:
 *     summary: 프로필 검색
 *     tags: [Profiles]
 */
router.get('/profiles', userController.searchProfiles);

/**
 * @swagger
 * /users/users/{userId}/follow:
 *   post:
 *     summary: 사용자 팔로우
 *     tags: [Follow]
 * /users/users/{userId}/unfollow:
 *   post:
 *     summary: 사용자 언팔로우
 *     tags: [Follow]
 */
router.post('/users/:userId/follow', userController.followUser);
router.post('/users/:userId/unfollow', userController.unfollowUser);

/**
 * @swagger
 * /users/profile/{profileId}/top-friends:
 *   get:
 *     summary: topFriends 조회
 *     tags: [Profiles]
 *   post:
 *     summary: topFriends 추가
 *     tags: [Profiles]
 */
router.get('/profile/:profileId/top-friends', userController.getTopFriends);
router.post('/profile/:profileId/top-friends', userController.addTopFriend);

/**
 * @swagger
 * /users/profile/{profileId}/top-friends/{friendId}:
 *   delete:
 *     summary: topFriends 삭제
 *     tags: [Profiles]
 */
router.delete('/profile/:profileId/top-friends/:friendId', userController.deleteTopFriend);

/**
 * @swagger
 * /users/check-email:
 *   post:
 *     summary: 이메일 중복 확인
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: 이메일 사용 가능 여부
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *       400:
 *         description: 잘못된 요청
 */
router.post('/check-email', userController.checkEmail);

/**
 * @swagger
 * /users/check-nickname:
 *   post:
 *     summary: 닉네임 중복 확인
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *     responses:
 *       200:
 *         description: 닉네임 사용 가능 여부
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *       400:
 *         description: 잘못된 요청
 */
router.post('/check-nickname', userController.checkNickname);

/**
 * @swagger
 * /users/check-username:
 *   post:
 *     summary: 로그인 ID 중복 확인
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 ID 사용 가능 여부
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *       400:
 *         description: 잘못된 요청
 */
router.post('/check-username', userController.checkUsername);

/**
 * @swagger
 * /users/password-reset:
 *   post:
 *     summary: 비밀번호 재설정 요청
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 요청 성공
 *       400:
 *         description: 잘못된 요청
 */
router.post('/password-reset', userController.forgotPassword);

/**
 * @swagger
 * /users/password-reset/verify:
 *   post:
 *     summary: 비밀번호 재설정
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 성공
 *       400:
 *         description: 잘못된 요청 또는 유효하지 않은 토큰
 */
router.post('/password-reset/verify', userController.resetPassword);

/**
 * @swagger
 * /users/profiles/{profileId}/report:
 *   post:
 *     summary: 프로필 신고
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: 신고 사유 등의 정보
 *       required: false
 *     responses:
 *       200:
 *         description: 신고 접수됨
 *       404:
 *         description: 프로필을 찾을 수 없음
 */
router.post('/profiles/:profileId/report', authenticateToken, userController.reportProfile);

/**
 * @swagger
 * /users/profile/{profileId}/block:
 *   post:
 *     summary: 특정 프로필 차단
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: 차단 완료
 *       404:
 *         description: 프로필을 찾을 수 없음
 * /users/profile/{profileId}/block/{blockedProfileId}:
 *   delete:
 *     summary: 특정 프로필 차단 해제
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: blockedProfileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 차단 해제됨
 *       404:
 *         description: 프로필을 찾을 수 없음
 */
router.post('/profile/:profileId/block', userController.blockProfile);
router.delete('/profile/:profileId/block/:blockedProfileId', userController.unblockProfile);

/**
 * @swagger
 * /users/profile/{profileId}/hide:
 *   post:
 *     summary: 특정 프로필 숨기기
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: 숨김 처리됨
 *       404:
 *         description: 프로필을 찾을 수 없음
 * /users/profile/{profileId}/hide/{hiddenProfileId}:
 *   delete:
 *     summary: 특정 프로필 숨기기 해제
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: hiddenProfileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 숨김 해제됨
 *       404:
 *         description: 프로필을 찾을 수 없음
 */
router.post('/profile/:profileId/hide', userController.hideProfile);
router.delete('/profile/:profileId/hide/:hiddenProfileId', userController.unhideProfile);

/**
 * @swagger
 * /users/profiles/{profileId}/follow/{targetProfileId}:
 *   post:
 *     summary: 특정 프로필 팔로우
 *     tags: [Follow]
 * /users/profiles/{profileId}/unfollow/{followingId}:
 *   delete:
 *     summary: 특정 프로필 언팔로우
 *     tags: [Follow]
 */
router.post('/profiles/:profileId/follow/:targetProfileId', userController.followProfile);
router.post('/profile/:profileId/follow/:followingId', userController.followProfile);
router.delete('/profiles/:profileId/unfollow/:followingId', userController.unfollowProfile);
router.delete('/profile/:profileId/followings/:followingId', userController.unfollowProfile);

/**
 * @swagger
 * /users/profiles/{profileId}/following:
 *   get:
 *     summary: 특정 프로필의 팔로잉 목록 조회
 *     tags: [Follow]
 * /users/profiles/{profileId}/followers:
 *   get:
 *     summary: 특정 프로필의 팔로워 목록 조회
 *     tags: [Follow]
 */
router.get('/profiles/:profileId/following', userController.getFollowingList);
router.get('/profile/:profileId/followings', userController.getFollowingList);
router.get('/profiles/:profileId/followers', userController.getFollowersList);
router.get('/profile/:profileId/followers', userController.getFollowersList);

/**
 * @swagger
 * /users/profiles/{profileId}/notifications:
 *   get:
 *     summary: 특정 프로필의 알림 목록 조회
 *     tags: [Notifications]
 */
router.get('/profiles/:profileId/notifications', userController.getNotifications);
router.get('/profile/:profileId/notifications', userController.getNotifications);

/**
 * @swagger
 * /users/profile/{profileId}/blocked-profiles:
 *   get:
 *     summary: 특정 프로필의 차단 목록 조회
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 차단된 프로필 목록
 *       404:
 *         description: 프로필을 찾을 수 없음
 * /users/profile/{profileId}/hidden-profiles:
 *   get:
 *     summary: 특정 프로필의 숨긴 프로필 목록 조회
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 숨긴 프로필 목록
 *       404:
 *         description: 프로필을 찾을 수 없음
 */
router.get('/profile/:profileId/blocked-profiles', userController.getBlockedProfiles);
router.get('profile/:profileId/block', userController.getBlockedProfiles);
router.get('/profile/:profileId/hidden-profiles', userController.getHiddenProfiles);
router.get('profile/:profileId/hide', userController.getHiddenProfiles);

/**
 * @swagger
 * /users/{userId}/profile/{profileId}:
 *   delete:
 *     summary: 특정 프로필 삭제
 *     tags: [Profiles]
 */
router.delete('/:userId/profile/:profileId', userController.deleteProfile);

/**
 * @swagger
 * /users/users/find:
 *   post:
 *     summary: 이메일과 휴대폰 번호로 사용자 ID 찾기
 *     tags: [Users]
 */
router.post('/users/find', userController.findUserId);

/**
 * @swagger
 * /users/users/validate:
 *   get:
 *     summary: username과 phoneNumber로 존재여부 확인
 *     tags: [Users]
 */
router.get('/users/validate', userController.checkUserExistence);

/**
 * @swagger
 * /users/users/password-reset:
 *   put:
 *     summary: 비밀번호 업데이트
 *     tags: [Users]
 */
router.put('/users/password-reset', userController.updatePassword);

module.exports = router;