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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: 회원가입에 성공했습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   description: 생성된 사용자의 고유 ID
 *       400:
 *         description: 요청 데이터가 잘못되었습니다. 필수 필드가 누락되었거나 형식이 올바르지 않습니다.
 *       409:
 *         description: 사용자 이름이 이미 존재합니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: 인증 토큰
 *       400:
 *         description: 요청 데이터가 잘못되었습니다.
 *       401:
 *         description: 인증에 실패했습니다. 사용자 이름 또는 비밀번호가 올바르지 않습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
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
 *         description: 로그아웃 처리되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
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
 *         description: 삭제할 사용자의 고유 ID
 *     responses:
 *       200:
 *         description: 사용자가 성공적으로 삭제되었습니다.
 *       400:
 *         description: 잘못된 userId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       403:
 *         description: 사용자 삭제 권한이 없습니다.
 *       404:
 *         description: 삭제할 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.delete('/:userId/delete', authenticateToken, userController.deleteUser);

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
 *         description: 프로필을 추가할 사용자의 고유 ID
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: 프로필이 성공적으로 추가되었습니다.
 *       400:
 *         description: 요청 데이터가 잘못되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.post('/:userId/profile', authenticateToken, upload(IMAGE_TYPES.PROFILE).single('profileImage'), userController.addProfile);

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
 *         description: 메인 카테고리 이름
 *     responses:
 *       200:
 *         description: 서브카테고리 목록을 성공적으로 조회하였습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       400:
 *         description: 잘못된 mainCategory 형식입니다.
 *       404:
 *         description: 메인 카테고리를 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.get('/subcategories/:mainCategory', userController.getSubCategories);

// 특정 프로필의 관심사 조회 라우트
/**
 * @swagger
 * /users/profiles/{profileId}/interests:
 *   get:
 *     summary: 관심사 조회
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 관심사를 조회할 프로필의 고유 ID
 *     responses:
 *       200:
 *         description: 관심사 목록을 성공적으로 조회하였습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       400:
 *         description: 잘못된 profileId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 *   post:
 *     summary: 관심사 추가
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 관심사를 추가할 프로필의 고유 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subCategory
 *             properties:
 *               subCategory:
 *                 type: string
 *                 description: 추가할 관심사의 서브카테고리
 *     responses:
 *       201:
 *         description: 관심사가 성공적으로 추가되었습니다.
 *       400:
 *         description: 요청 데이터가 잘못되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.get('/profiles/:profileId/interests', authenticateToken, userController.getInterests);
router.post('/profiles/:profileId/interests', authenticateToken, userController.addInterest);

/**
 * @swagger
 * /users/profiles/{profileId}/interests/{subCategory}:
 *   delete:
 *     summary: 관심사 삭제
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 관심사를 삭제할 프로필의 고유 ID
 *       - in: path
 *         name: subCategory
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 관심사의 서브카테고리
 *     responses:
 *       200:
 *         description: 관심사가 성공적으로 삭제되었습니다.
 *       400:
 *         description: 잘못된 요청 파라미터가 제공되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       403:
 *         description: 관심사 삭제 권한이 없습니다.
 *       404:
 *         description: 삭제할 관심사를 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.delete('/profiles/:profileId/interests/:subCategory', authenticateToken, userController.deleteInterest);

/**
 * @swagger
 * /users/{userId}/profiles:
 *   get:
 *     summary: 사용자 프로필 목록
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 프로필 목록을 조회할 사용자의 고유 ID
 *     responses:
 *       200:
 *         description: 사용자의 프로필 목록을 성공적으로 조회하였습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Profile'
 *       400:
 *         description: 잘못된 userId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.get('/:userId/profile', authenticateToken, userController.getUserProfiles);
router.get('/:userId/profiles', authenticateToken, userController.getUserProfiles);

/**
 * @swagger
 * /users/profiles/{profileId}:
 *   put:
 *     summary: 프로필 수정
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 수정할 프로필의 고유 ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: 프로필이 성공적으로 수정되었습니다.
 *       400:
 *         description: 요청 데이터가 잘못되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       403:
 *         description: 프로필 수정 권한이 없습니다.
 *       404:
 *         description: 수정할 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 *   get:
 *     summary: 특정 프로필 조회
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 프로필의 고유 ID
 *     responses:
 *       200:
 *         description: 프로필을 성공적으로 조회하였습니다.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         description: 잘못된 profileId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 *   delete:
 *     summary: 특정 프로필 삭제
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 프로필의 고유 ID
 *     responses:
 *       200:
 *         description: 프로필이 성공적으로 삭제되었습니다.
 *       400:
 *         description: 잘못된 profileId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       403:
 *         description: 프로필 삭제 권한이 없습니다.
 *       404:
 *         description: 삭제할 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.put('/profiles/:profileId', authenticateToken, upload(IMAGE_TYPES.PROFILE).single('profileImage'), userController.updateProfile);
router.get('/profiles/:profileId', authenticateToken, userController.getProfile);
router.delete('/profiles/:profileId', authenticateToken, userController.deleteProfile);

/**
 * @swagger
 * /users/profiles:
 *   get:
 *     summary: 프로필 검색
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: 검색할 프로필의 키워드
 *     responses:
 *       200:
 *         description: 프로필 검색이 성공적으로 완료되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Profile'
 *       400:
 *         description: 잘못된 요청 파라미터가 제공되었습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.get('/profiles', authenticateToken, userController.searchProfiles);

/**
 * @swagger
 * /users/users/{userId}/follow:
 *   post:
 *     summary: 사용자 팔로우
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 팔로우할 사용자의 고유 ID
 *     responses:
 *       200:
 *         description: 사용자를 성공적으로 팔로우했습니다.
 *       400:
 *         description: 잘못된 userId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 팔로우할 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 * /users/users/{userId}/unfollow:
 *   post:
 *     summary: 사용자 언팔로우
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 언팔로우할 사용자의 고유 ID
 *     responses:
 *       200:
 *         description: 사용자를 성공적으로 언팔로우했습니다.
 *       400:
 *         description: 잘못된 userId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 언팔로우할 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.post('/users/:userId/follow', authenticateToken, userController.followUser);
router.post('/users/:userId/unfollow', authenticateToken, userController.unfollowUser);

/**
 * @swagger
 * /users/profile/{profileId}/top-friends:
 *   get:
 *     summary: topFriends 조회
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: topFriends를 조회할 프로필의 고유 ID
 *     responses:
 *       200:
 *         description: topFriends 목록을 성공적으로 조회하였습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Profile'
 *       400:
 *         description: 잘못된 profileId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 *   post:
 *     summary: topFriends 추가
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: topFriends를 추가할 프로필의 고유 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friendId
 *             properties:
 *               friendId:
 *                 type: string
 *                 description: 추가할 친구의 프로필 ID
 *     responses:
 *       201:
 *         description: topFriends가 성공적으로 추가되었습니다.
 *       400:
 *         description: 요청 데이터가 잘못되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       403:
 *         description: topFriends 추가 권한이 없습니다.
 *       404:
 *         description: 추가할 친구의 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.get('/profile/:profileId/top-friends', authenticateToken, userController.getTopFriends);
router.post('/profile/:profileId/top-friends', authenticateToken, userController.addTopFriend);

/**
 * @swagger
 * /users/profile/{profileId}/top-friends/{friendId}:
 *   delete:
 *     summary: topFriends 삭제
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: topFriends를 삭제할 프로필의 고유 ID
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 친구의 프로필 ID
 *     responses:
 *       200:
 *         description: topFriends가 성공적으로 삭제되었습니다.
 *       400:
 *         description: 잘못된 요청 파라미터가 제공되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       403:
 *         description: topFriends 삭제 권한이 없습니다.
 *       404:
 *         description: 삭제할 친구의 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.delete('/profile/:profileId/top-friends/:friendId', authenticateToken, userController.deleteTopFriend);

/**
 * @swagger
 * /users/profile/{profileId}/block:
 *   post:
 *     summary: 특정 프로필 차단
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 차단할 프로필의 고유 ID
 *     responses:
 *       201:
 *         description: 프로필이 성공적으로 차단되었습니다.
 *       400:
 *         description: 잘못된 profileId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 차단할 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 * /users/profile/{profileId}/block/{blockedProfileId}:
 *   delete:
 *     summary: 특정 프로필 차단 해제
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 차단을 해제할 프로필의 고유 ID
 *       - in: path
 *         name: blockedProfileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 차단 해제할 프로필의 고유 ID
 *     responses:
 *       200:
 *         description: 프로필 차단이 성공적으로 해제되었습니다.
 *       400:
 *         description: 잘못된 요청 파라미터가 제공되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 차단 해제할 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.post('/profile/:profileId/block', authenticateToken, userController.blockProfile);
router.delete('/profile/:profileId/block/:blockedProfileId', authenticateToken, userController.unblockProfile);

/**
 * @swagger
 * /users/profile/{profileId}/hide:
 *   post:
 *     summary: 특정 프로필 숨기기
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 숨기려는 프로필의 고유 ID
 *     responses:
 *       201:
 *         description: 프로필이 성공적으로 숨김 처리되었습니다.
 *       400:
 *         description: 잘못된 profileId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 숨기려는 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 * /users/profile/{profileId}/hide/{hiddenProfileId}:
 *   delete:
 *     summary: 특정 프로필 숨기기 해제
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 숨기기를 해제할 프로필의 고유 ID
 *       - in: path
 *         name: hiddenProfileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 숨기기 해제할 프로필의 고유 ID
 *     responses:
 *       200:
 *         description: 프로필 숨기기가 성공적으로 해제되었습니다.
 *       400:
 *         description: 잘못된 요청 파라미터가 제공되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 숨기기 해제할 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.post('/profile/:profileId/hide', authenticateToken, userController.hideProfile);
router.delete('/profile/:profileId/hide/:hiddenProfileId', authenticateToken, userController.unhideProfile);

/**
 * @swagger
 * /users/profiles/{profileId}/follow/{followingId}:
 *   post:
 *     summary: 특정 프로필 팔로우
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 팔로우할 프로필의 고유 ID
 *       - in: path
 *         name: followingId
 *         required: true
 *         schema:
 *           type: string
 *         description: 팔로우 대상 프로필의 고유 ID
 *     responses:
 *       200:
 *         description: 프로필을 성공적으로 팔로우했습니다.
 *       400:
 *         description: 잘못된 요청 파라미터가 제공되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 팔로우할 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 * /users/profiles/{profileId}/unfollow/{followingId}:
 *   delete:
 *     summary: 특정 프로필 언팔로우
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 언팔로우할 프로필의 고유 ID
 *       - in: path
 *         name: followingId
 *         required: true
 *         schema:
 *           type: string
 *         description: 언팔로우 대상 프로필의 고유 ID
 *     responses:
 *       200:
 *         description: 프로필을 성공적으로 언팔로우했습니다.
 *       400:
 *         description: 잘못된 요청 파라미터가 제공되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 언팔로우할 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.post('/profiles/:profileId/follow/:followingId', authenticateToken, userController.followProfile);
router.delete('/profiles/:profileId/unfollow/:followingId', authenticateToken, userController.unfollowProfile);

/**
 * @swagger
 * /users/profiles/{profileId}/following:
 *   get:
 *     summary: 특정 프로필의 팔로잉 목록 조회
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 팔로잉 목록을 조회할 프로필의 고유 ID
 *     responses:
 *       200:
 *         description: 팔로잉 목록을 성공적으로 조회하였습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Profile'
 *       400:
 *         description: 잘못된 profileId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 * /users/profiles/{profileId}/followers:
 *   get:
 *     summary: 특정 프로필의 팔로워 목록 조회
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 팔로워 목록을 조회할 프로필의 고유 ID
 *     responses:
 *       200:
 *         description: 팔로워 목록을 성공적으로 조회하였습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Profile'
 *       400:
 *         description: 잘못된 profileId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.get('/profiles/:profileId/following', authenticateToken, userController.getFollowingList);
router.get('/profiles/:profileId/followers', authenticateToken, userController.getFollowersList);
router.get('/profile/:profileId/following', authenticateToken, userController.getFollowingList);
router.get('/profile/:profileId/followers', authenticateToken, userController.getFollowersList);

/**
 * @swagger
 * /users/profile/{profileId}/blocked-profiles:
 *   get:
 *     summary: 특정 프로필의 차단 목록 조회
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 차단 목록을 조회할 프로필의 고유 ID
 *     responses:
 *       200:
 *         description: 차단된 프로필 목록을 성공적으로 조회하였습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Profile'
 *       400:
 *         description: 잘못된 profileId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 * /users/profile/{profileId}/hidden-profiles:
 *   get:
 *     summary: 특정 프로필의 숨긴 프로필 목록 조회
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 숨긴 프로필 목록을 조회할 프로필의 고유 ID
 *     responses:
 *       200:
 *         description: 숨긴 프로필 목록을 성공적으로 조회하였습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Profile'
 *       400:
 *         description: 잘못된 profileId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.get('/profile/:profileId/blocked-profiles', authenticateToken, userController.getBlockedProfiles);
router.get('/profile/:profileId/block', authenticateToken, userController.getBlockedProfiles);
router.get('/profile/:profileId/hidden-profiles', authenticateToken, userController.getHiddenProfiles);
router.get('/profile/:profileId/hide', authenticateToken, userController.getHiddenProfiles);

/**
 * @swagger
 * /users/{userId}/profile/{profileId}:
 *   delete:
 *     summary: 특정 프로필 삭제
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 프로필이 속한 사용자의 고유 ID
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 프로필의 고유 ID
 *     responses:
 *       200:
 *         description: 프로필이 성공적으로 삭제되었습니다.
 *       400:
 *         description: 잘못된 요청 파라미터가 제공되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       403:
 *         description: 프로필 삭제 권한이 없습니다.
 *       404:
 *         description: 삭제할 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.delete('/:userId/profile/:profileId', authenticateToken, userController.deleteProfile);

/**
 * @swagger
 * /users/find:
 *   post:
 *     summary: 이메일과 휴대폰 번호로 사용자 ID 찾기
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - phoneNumber
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: 사용자 ID가 성공적으로 조회되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   description: 조회된 사용자의 고유 ID
 *       400:
 *         description: 요청 데이터가 잘못되었습니다.
 *       404:
 *         description: 일치하는 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.post('/users/find', authenticateToken, userController.findUserId);

/**
 * @swagger
 * /users/validate:
 *   get:
 *     summary: username과 phoneNumber로 존재여부 확인
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         description: 확인할 사용자 이름
 *       - in: query
 *         name: phoneNumber
 *         schema:
 *           type: string
 *         description: 확인할 휴대폰 번호
 *     responses:
 *       200:
 *         description: 사용자 존재 여부가 성공적으로 확인되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                   description: 사용자의 존재 여부
 *       400:
 *         description: 잘못된 요청 파라미터가 제공되었습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.get('/users/validate', authenticateToken, userController.checkUserExistence);

/**
 * @swagger
 * /users/password-reset:
 *   put:
 *     summary: 비밀번호 업데이트
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - newPassword
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 비밀번호를 업데이트할 사용자의 고유 ID
 *               newPassword:
 *                 type: string
 *                 description: 새로운 비밀번호
 *     responses:
 *       200:
 *         description: 비밀번호가 성공적으로 업데이트되었습니다.
 *       400:
 *         description: 요청 데이터가 잘못되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       403:
 *         description: 비밀번호 업데이트 권한이 없습니다.
 *       404:
 *         description: 사용자를 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.put('/users/password-reset', authenticateToken, userController.updatePassword);

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

module.exports = router;