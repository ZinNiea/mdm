// routes/auction.js
// #swagger.tags = ['Auctions']
const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const chatController = require('../controllers/chatController'); // 추가: chatController 임포트
const { upload, IMAGE_TYPES } = require('../middlewares/uploadMiddleware');

// 경매 아이템 생성
// #swagger.description = '새로운 경매 아이템을 생성합니다.'
// #swagger.responses[201] = { description: '경매 아이템 생성 성공' }
// #swagger.responses[400] = { description: '잘못된 요청 데이터' }
// #swagger.responses[401] = { description: '인증 필요' }
// #swagger.responses[500] = { description: '서버 오류' }
// #swagger.parameters['profileId'] = { description: '사용자 프로필 ID', in: 'formData', type: 'string', required: true }
// #swagger.parameters['title'] = { description: '경매 제목', in: 'formData', type: 'string', required: true }
// #swagger.parameters['content'] = { description: '경매 내용', in: 'formData', type: 'string', required: true }
// #swagger.parameters['category'] = { description: '카테고리', in: 'formData', type: 'string', required: true, enum: ['거래', '나눔', '과테말라'] }
// #swagger.parameters['startingbid'] = { description: '시작 입찰가', in: 'formData', type: 'number', required: true }
// #swagger.parameters['buyNowPrice'] = { description: '즉시구매가', in: 'formData', type: 'number', required: true }
// #swagger.parameters['duration'] = { description: '경매 지속 시간(시간)', in: 'formData', type: 'number', required: true }
// #swagger.parameters['images'] = { description: '이미지 파일(최대 4개)', in: 'formData', type: 'file', required: true }
router.post('/', upload(IMAGE_TYPES.AUCTION).array('images', 4), auctionController.createAuctionItem);

// 경매 아이템 목록 조회
// #swagger.description = '모든 경매 아이템을 조회합니다.'
// #swagger.responses[200] = { description: '경매 아이템 목록 반환' }
// #swagger.responses[500] = { description: '서버 오류' }
router.get('/', auctionController.getAuctionItems);

// 경매 아이템 상세 조회
// #swagger.description = '특정 경매 아이템의 상세 정보를 조회합니다.'
// #swagger.responses[200] = { description: '경매 아이템 상세 정보 반환' }
// #swagger.responses[404] = { description: '경매 아이템을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
// #swagger.parameters['auctionId'] = { description: '경매 아이템 ID', in: 'path', type: 'string' }
router.get('/:auctionId', auctionController.getAuctionItemById);

// 경매 아이템 수정
// #swagger.description = '특정 경매 아이템을 수정합니다.'
// #swagger.responses[200] = { description: '경매 아이템 수정 성공' }
// #swagger.responses[400] = { description: '잘못된 요청 데이터' }
// #swagger.responses[403] = { description: '수정 권한 없음' }
// #swagger.responses[404] = { description: '경매 아이템을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.put('/:auctionId', upload(IMAGE_TYPES.AUCTION).array('images', 4), auctionController.updateAuctionItem);

// 경매 아이템 삭제
// #swagger.description = '특정 경매 아이템을 삭제합니다.'
// #swagger.responses[200] = { description: '경매 아이템 삭제 성공' }
// #swagger.responses[403] = { description: '삭제 권한 없음' }
// #swagger.responses[404] = { description: '경매 아이템을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
// #swagger.parameters['auctionId'] = { description: '경매 아이템 ID', in: 'path', type: 'string' }
router.delete('/:auctionId', auctionController.deleteAuctionItem);

// #swagger.description = '특정 경매 아이템에 입찰합니다.'
// #swagger.responses[201] = { description: '입찰 성공' }
// #swagger.responses[400] = { description: '잘못된 요청 데이터' }
// #swagger.responses[401] = { description: '인증 필요' }
// #swagger.responses[404] = { description: '경매 아이템을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.post('/:auctionId/bids', auctionController.placeBid);


// #swagger.description = '특정 경매 아이템에 즉시 구매를 진행합니다.'
router.post('/:auctionId/instant-buys', auctionController.instantBuy);

// #swagger.description = '특정 경매 아이템을 종료합니다.'
// #swagger.responses[200] = { description: '경매 종료 성공' }
// #swagger.responses[400] = { description: '잘못된 요청 데이터' }
// #swagger.responses[404] = { description: '경매 아이템을 찾을 수 없음' }
// #swagger.responses[409] = { description: '경매가 이미 종료되었습니다.' }
// #swagger.responses[500] = { description: '서버 오류' }
router.post('/:auctionId/end', auctionController.endAuction);

// swagger.description = '특정 프로필이 생성한 경매 아이템을 조회합니다.'
// swagger.responses[200] = { description: '경매 아이템 목록 반환' }
// swagger.responses[500] = { description: '서버 오류' }
router.get('/profile/:profileId', auctionController.getAuctionsByProfile);

// #swagger.description = '특정 경매 아이템을 신고합니다.'
// #swagger.responses[200] = { description: '신고 성공' }
// #swagger.responses[404] = { description: '경매 아이템을 찾을 수 없음' }
// #swagger.responses[500] = { description: '서버 오류' }
router.post('/:auctionId/reports', auctionController.reportAuctionItem);

// #swagger.description = '특정 경매 아이템에 대한 채팅방 목록을 조회합니다.'
// #swagger.responses[200] = { description: '채팅방 목록 반환' }
// #swagger.responses[500] = { description: '서버 오류' }
router.get('/:auctionId/chat-rooms', chatController.getAuctionChatRooms);

module.exports = router;