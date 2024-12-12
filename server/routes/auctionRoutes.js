// routes/auction.js
const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const { upload, IMAGE_TYPES } = require('../middlewares/uploadMiddleware');

// 경매 아이템 생성
router.post('/', upload(IMAGE_TYPES.AUCTION).array('images', 4), auctionController.createAuctionItem);

// 경매 아이템 목록 조회
router.get('/', auctionController.getAuctionItems);

// 특정 경매 아이템 조회
router.get('/:auctionId', auctionController.getAuctionItemById);

// 입찰
router.post('/:auctionId/bids', auctionController.placeBid);

// 즉시구매
router.post('/:auctionId/instant-buys', auctionController.instantBuy);

// 경매 종료
router.post('/:auctionId/end', auctionController.endAuction);

// 경매 아이템 삭제
router.delete('/:auctionId', auctionController.deleteAuctionItem);

// 경매 아이템 수정
router.put('/:auctionId', upload(IMAGE_TYPES.AUCTION).array('images', 4), auctionController.updateAuctionItem);

// 특정 프로필이 생성한 경매 아이템 조회
router.get('/profile/:profileId', auctionController.getAuctionsByProfile);

// 경매 신고
router.post('/:auctionId/reports', auctionController.reportAuctionItem);

module.exports = router;