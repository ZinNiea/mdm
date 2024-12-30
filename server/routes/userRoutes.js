// server/user/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// AWS S3 업로드 미들웨어 가져오기
const { upload, IMAGE_TYPES } = require('../middlewares/uploadMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');


router.post('/register', upload(IMAGE_TYPES.PROFILE).single('profileImage'), userController.registerUser);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.delete('/:userId/delete', userController.deleteUser);
router.post('/:userId/profile', upload(IMAGE_TYPES.PROFILE).single('profileImage'), userController.addProfile);
router.get('/subcategories/:mainCategory', userController.getSubCategories);

// 특정 프로필의 관심사 조회 라우트
router.get('/profiles/:profileId/interests', userController.getInterests);

// 특정 프로필에 관심사 추가 라우트
router.post('/profiles/:profileId/interests', userController.addInterest);

// 특정 프로필에 관심사 삭제 라우트
router.delete('/profiles/:profileId/interests/:subCategory', userController.deleteInterest);

// 특정 유저의 프로필 목록 조회 라우트
router.get('/:userId/profile', userController.getUserProfiles);
router.get('/:userId/profiles', userController.getUserProfiles);

// 특정 프로필 수정 라우트
router.put('/profiles/:profileId', upload(IMAGE_TYPES.PROFILE).single('profileImage'), userController.updateProfile);

// 특정 프로필 조회 라우트
router.get('/profiles/:profileId', userController.getProfile);

// 프로필 검색 라우트 추가
router.get('/profiles', userController.searchProfiles);

// 팔로우 기능 라우트
router.post('/users/:userId/follow', userController.followUser);
router.post('/users/:userId/unfollow', userController.unfollowUser);

// 프로필의 topFriends 조회 라우트 추가
router.get('/profile/:profileId/top-friends', userController.getTopFriends);

// 프로필의 topFriends 추가 라우트 추가
router.post('/profile/:profileId/top-friends', userController.addTopFriend);

// 프로필의 topFriends 삭제 라우트 추가
router.delete('/profile/:profileId/top-friends/:friendId', userController.deleteTopFriend);

// 이메일 중복 확인 라우트 추가
router.post('/check-email', userController.checkEmail);

// 닉네임 중복 확인 라우트 추가
router.post('/check-nickname', userController.checkNickname);

// 로그인 ID 중복 확인 라우트 추가
router.post('/check-username', userController.checkUsername);

// 비밀번호 재설정 요청 라우트
router.post('/password-reset', userController.forgotPassword);

// 비밀번호 재설정 라우트
router.post('/password-reset/verify', userController.resetPassword);

// 프로필 신고 라우트 추가
router.post('/profiles/:profileId/report', authenticateToken, userController.reportProfile);

// 특정 프로필 차단 라우트
router.post('/profile/:profileId/block', userController.blockProfile);
router.delete('/profile/:profileId/block/:blockedProfileId', userController.unblockProfile);

// 특정 프로필 숨기기 라우트
router.post('/profile/:profileId/hide', userController.hideProfile);
router.delete('/profile/:profileId/hide/:hiddenProfileId', userController.unhideProfile);

// 특정 프로필을 팔로우하는 라우트 추가
router.post('/profiles/:profileId/follow/:targetProfileId', userController.followProfile);
router.post('/profile/:profileId/follow/:followingId', userController.followProfile);

// 특정 프로필의 팔로우를 해제하는 라우트 추가
router.delete('/profiles/:profileId/unfollow/:followingId', userController.unfollowProfile);
router.delete('/profile/:profileId/followings/:followingId', userController.unfollowProfile);

// 특정 프로필의 팔로잉 목록을 조회하는 라우트 추가
router.get('/profiles/:profileId/following', userController.getFollowingList);
router.get('/profile/:profileId/followings', userController.getFollowingList);

// 특정 프로필의 팔로워 목록을 조회하는 라우트 추가
router.get('/profiles/:profileId/followers', userController.getFollowersList);
router.get('/profile/:profileId/followers', userController.getFollowersList);

// 유저의 알림을 조회하는 라우트 추가
router.get('/profiles/:profileId/notifications', userController.getNotifications);
router.get('/profile/:profileId/notifications', userController.getNotifications);

// 특정 프로필의 차단된 프로필 목록 조회 라우트 추가
router.get('/profile/:profileId/blocked-profiles', userController.getBlockedProfiles);
router.get('profile/:profileId/block', userController.getBlockedProfiles);
///profile/:profileId/block

// 특정 프로필의 숨긴 프로필 목록 조회 라우트 추가
router.get('/profile/:profileId/hidden-profiles', userController.getHiddenProfiles);
router.get('profile/:profileId/hide', userController.getHiddenProfiles);
///profile/:profileId/hide

// 특정 프로필 삭제 라우트 추가
router.delete('/profiles/:profileId', userController.deleteProfile);
router.delete('/:userId/profile/:profileId', userController.deleteProfile);

// 이메일과 휴대폰 번호로 사용자 ID 찾기 라우트 추가
router.post('/users/find', userController.findUserId);

// username과 phoneNumber를 이용해 사용자의 유효성을 확인하는 라우트
router.get('/users/validate', userController.checkUserExistence);

// 비밀번호 재설정 요청 라우트
// router.post('/users/password-reset', userController.requestPasswordReset);

// 비밀번호 업데이트 라우트
router.put('/users/password-reset', userController.updatePassword);
module.exports = router;