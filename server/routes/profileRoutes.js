// server/routes/profileRoutes.js
// #swagger.tags = ['Profile']
const express = require('express');
const router = express.Router();

const auctionController = require('../controllers/auctionController');
const chatController = require('../controllers/chatController');
const postController = require('../controllers/postController');
const profileController = require('../controllers/profileController');

// AWS S3 업로드 미들웨어 가져오기
const { upload, IMAGE_TYPES } = require('../middlewares/uploadMiddleware');
// JWT 인증 미들웨어 가져오기
const { authenticateToken } = require('../middlewares/authMiddleware');

// 프로필별 경매 목록 조회
// #swagger.description = '특정 프로필이 생성한 경매 목록을 조회합니다'
// #swagger.responses[200] = { description: '프로필의 경매 목록 반환' }
// #swagger.responses[500] = { description: '서버 오류' }
router.get('/:profileId/auctions', auctionController.getAuctionsByProfile);

// 프로필별 채팅방 목록 조회
// #swagger.description = '특정 프로필이 참여하고 있는 채팅방 목록을 조회합니다'
// #swagger.parameters['category'] = { description: '채팅방 카테고리 필터(선택사항)', in: 'query', type: 'string' }
// #swagger.responses[200] = { description: '채팅방 목록 반환' }
// #swagger.responses[500] = { description: '서버 오류' }
router.get('/:profileId/chat-rooms', chatController.getUserChatRooms);

// 프로필별 북마크된 게시물 목록 조회
// #swagger.description = '특정 프로필이 북마크한 게시물 목록을 조회합니다'
// #swagger.responses[200] = { description: '북마크된 게시물 목록 반환' }
// #swagger.responses[500] = { description: '서버 오류' }
router.get('/:profileId/bookmarks', postController.getBookmarkedPosts);

// 프로필별 게시물 목록 조회
// #swagger.description = '특정 프로필이 작성한 게시물 목록을 조회합니다'
// #swagger.responses[200] = { description: '게시물 목록 반환' }
// #swagger.responses[500] = { description: '서버 오류' }
router.get('/:profileId', postController.getPostsByProfile);

// 프로필별 관심사 조회
// #swagger.description = '특정 프로필의 관심사를 조회합니다'
// #swagger.responses[200] = { description: '관심사 목록 반환' }
// #swagger.responses[500] = { description: '서버 오류' }
router.get('/:profileId/interests', profileController.getInterests);

// 프로필별 관심사 추가
// #swagger.description = '특정 프로필에 관심사를 추가합니다'
// #swagger.parameters['mainCategory'] = { description: '관심사 대분류', in: 'body', required: true, type: 'string' }
// #swagger.parameters['subCategory'] = { description: '관심사 소분류', in: 'body', required: true, type: 'string' }
// #swagger.parameters['bias'] = { description: '관심사 편향도', in: 'body', required: false, type: 'number' }
// #swagger.responses[201] = { description: '관심사 추가 성공' }
// #swagger.responses[400] = { description: '잘못된 요청' }
// #swagger.responses[404] = { description: '프로필을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.post('/:profileId/interests', profileController.addInterest);

// 프로필별 관심사 삭제
// #swagger.description = '특정 프로필의 관심사를 삭제합니다'
// #swagger.responses[200] = { description: '관심사 삭제 성공' }
// #swagger.responses[404] = { description: '프로필 또는 관심사를 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
// #swagger.parameters['profileId'] = { description: '프로필 ID', in: 'path', required: true, type: 'string' }
// #swagger.parameters['subCategory'] = { description: '삭제할 관심사 소분류', in: 'path', required: true, type: 'string' }
router.delete('/:profileId/interests/:subCategory', profileController.deleteInterest);

// 특정 프로필 수정
// #swagger.description = '특정 프로필을 수정합니다'
// #swagger.responses[201] = { description: '프로필 수정 성공' }
// #swagger.responses[404] = { description: '프로필을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.put('/:profileId', authenticateToken, upload(IMAGE_TYPES.PROFILE).single('profileImage'), profileController.updateProfile);

// 특정 프로필 조회
// #swagger.description = '특정 프로필을 조회합니다'
// #swagger.responses[200] = { description: '프로필 조회 성공' }
// #swagger.responses[404] = { description: '프로필을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.get('/:profileId', authenticateToken, profileController.getProfile);

// 프로필 삭제
// #swagger.description = '특정 프로필을 삭제합니다'
// #swagger.responses[200] = { description: '프로필 삭제 성공' }
// #swagger.responses[404] = { description: '유저 또는 프로필을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.delete('/:profileId', authenticateToken, profileController.deleteProfile);

// 프로필 검색
// #swagger.description = '프로필을 검색합니다'
// #swagger.responses[200] = { description: '프로필 검색 성공' }
// #swagger.responses[500] = { description: '서버 오류' }
router.get('/', authenticateToken, profileController.searchProfiles);

// 프로필의 topFriends 조회
// #swagger.description = '특정 프로필의 topFriends를 조회합니다'
// #swagger.responses[200] = { description: 'topFriends 조회 성공' }
// #swagger.responses[404] = { description: '프로필을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.get('/:profileId/top-friends', authenticateToken, profileController.getTopFriends);

// 프로필의 topFriends 추가
// #swagger.description = '특정 프로필에 topFriends를 추가합니다'
// #swagger.responses[201] = { description: 'topFriends 추가 성공' }
// #swagger.responses[400] = { description: '잘못된 요청' }
// #swagger.responses[404] = { description: '프로필을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.post('/:profileId/top-friends', authenticateToken, profileController.addTopFriend);

// 프로필의 topFriends 삭제
// #swagger.description = '특정 프로필의 topFriends를 삭제합니다'
// #swagger.responses[200] = { description: 'topFriends 삭제 성공' }
// #swagger.responses[404] = { description: '프로필 또는 topFriends를 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.delete('/:profileId/top-friends/:friendId', authenticateToken, profileController.deleteTopFriend);

// 특정 프로필 차단
// #swagger.description = '특정 프로필을 차단합니다'
// #swagger.responses[200] = { description: '프로필 차단 성공' }
// #swagger.responses[404] = { description: '프로필을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.post('/:profileId/blocks/:blockedProfileId', authenticateToken, profileController.blockProfile);

// 특정 프로필 차단 해제
// #swagger.description = '특정 프로필의 차단을 해제합니다'
// #swagger.responses[200] = { description: '프로필 차단 해제 성공' }
// #swagger.responses[404] = { description: '프로필을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.delete('/:profileId/blocks/:blockedProfileId', authenticateToken, profileController.unblockProfile);

// 특정 프로필 숨기기
// #swagger.description = '특정 프로필을 숨깁니다'
// #swagger.responses[200] = { description: '프로필 숨기기 성공' }
// #swagger.responses[400] = { description: '잘못된 요청' }
// #swagger.responses[404] = { description: '프로필을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.post('/:profileId/hidden-profiles/:hiddenProfileId', authenticateToken, profileController.hideProfile);

// 특정 프로필 숨기기 해제
// #swagger.description = '특정 프로필의 숨기기를 해제합니다'
// #swagger.responses[200] = { description: '프로필 숨기기 해제 성공' }
// #swagger.responses[400] = { description: '잘못된 요청' }
// #swagger.responses[404] = { description: '프로필을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.delete('/:profileId/hidden-profiles/:hiddenProfileId', authenticateToken, profileController.unhideProfile);

// 특정 프로필 팔로우
// #swagger.description = '특정 프로필을 팔로우합니다'
// #swagger.responses[200] = { description: '프로필 팔로우 성공' }
// #swagger.responses[400] = { description: '잘못된 요청' }
// #swagger.responses[404] = { description: '프로필을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.post('/:profileId/following/:followingProfileId', authenticateToken, profileController.followProfile);

// 특정 프로필 팔로우 해제
// #swagger.description = '특정 프로필의 팔로우를 해제합니다'
// #swagger.responses[200] = { description: '프로필 팔로우 해제 성공' }
// #swagger.responses[400] = { description: '잘못된 요청' }
// #swagger.responses[404] = { description: '프로필을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.delete('/:profileId/following/:followingProfileId', authenticateToken, profileController.unfollowProfile);

// 특정 프로필의 팔로워 목록 조회
// #swagger.description = '특정 프로필의 팔로워 목록을 조회합니다'
// #swagger.responses[200] = { description: '팔로워 목록 조회 성공' }
// #swagger.responses[404] = { description: '프로필을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.get('/:profileId/followers', authenticateToken, profileController.getFollowers);

// 특정 프로필의 팔로잉 목록 조회
// #swagger.description = '특정 프로필의 팔로잉 목록을 조회합니다'
// #swagger.responses[200] = { description: '팔로잉 목록 조회 성공' }
// #swagger.responses[404] = { description: '프로필을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.get('/:profileId/followings', authenticateToken, profileController.getFollowings);

// 특정 프로필의 차단 목록 조회
// #swagger.description = '특정 프로필의 차단 목록을 조회합니다'
// #swagger.responses[200] = { description: '차단 목록 조회 성공' }
// #swagger.responses[404] = { description: '프로필을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.get('/:profileId/blocks', authenticateToken, profileController.getBlockedProfiles);

// 특정 프로필의 숨김 목록 조회
// #swagger.description = '특정 프로필의 숨김 목록을 조회합니다'
// #swagger.responses[200] = { description: '숨김 목록 조회 성공' }
// #swagger.responses[404] = { description: '프로필을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.get('/:profileId/hidden-profiles', authenticateToken, profileController.getHiddenProfiles);

// 

module.exports = router;