// routes/auction.js
const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const { upload, IMAGE_TYPES } = require('../middlewares/uploadMiddleware');

/**
 * @swagger
 * /auctions:
 *   post:
 *     summary: 경매 아이템을 생성합니다.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: images
 *         type: array
 *         items:
 *           type: file
 *         description: 업로드할 이미지 파일들 (최대 4개)
 *     responses:
 *       201:
 *         description: 경매 아이템이 성공적으로 생성되었습니다.
 *       400:
 *         description: 잘못된 요청입니다.
 */
/**
 * @swagger
 * /auctions:
 *   post:
 *     summary: 경매 아이템 생성
 *     tags: [Auctions]
 */
router.post('/', upload(IMAGE_TYPES.AUCTION).array('images', 4), auctionController.createAuctionItem);

/**
 * @swagger
 * /auctions:
 *   get:
 *     summary: 경매 아이템 목록 조회
 *     tags: [Auctions]
 */
router.get('/', auctionController.getAuctionItems);

/**
 * @swagger
 * /auctions/{auctionId}:
 *   get:
 *     summary: 특정 경매 아이템 조회
 *     tags: [Auctions]
 *   delete:
 *     summary: 경매 아이템 삭제
 *     tags: [Auctions]
 *     parameters:
 *       - in: path
 *         name: auctionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 아이템 삭제됨
 *       404:
 *         description: 항목을 찾을 수 없음
 *   put:
 *     summary: 경매 아이템 수정
 *     tags: [Auctions]
 */
router.get('/:auctionId', auctionController.getAuctionItemById);
router.delete('/:auctionId', auctionController.deleteAuctionItem);
router.put('/:auctionId', upload(IMAGE_TYPES.AUCTION).array('images', 4), auctionController.updateAuctionItem);

/**
 * @swagger
 * /auctions/{auctionId}/bids:
 *   post:
 *     summary: 입찰
 *     tags: [Auctions]
 *     parameters:
 *       - in: path
 *         name: auctionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: 입찰 가격 정보
 *       required: true
 *     responses:
 *       201:
 *         description: 입찰 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 경매를 찾을 수 없음
 */
router.post('/:auctionId/bids', auctionController.placeBid);

/**
 * @swagger
 * /auctions/{auctionId}/instant-buys:
 *   post:
 *     summary: 즉시구매
 *     tags: [Auctions]
 *     parameters:
 *       - in: path
 *         name: auctionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: 즉시구매 성공
 *       404:
 *         description: 경매를 찾을 수 없음
 */
router.post('/:auctionId/instant-buys', auctionController.instantBuy);

/**
 * @swagger
 * /auctions/{auctionId}/end:
 *   post:
 *     summary: 경매 종료
 *     tags: [Auctions]
 *     parameters:
 *       - in: path
 *         name: auctionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 경매 종료됨
 *       404:
 *         description: 경매를 찾을 수 없음
 */
router.post('/:auctionId/end', auctionController.endAuction);

/**
 * @swagger
 * /auctions/profile/{profileId}:
 *   get:
 *     summary: 특정 프로필이 생성한 경매 아이템 조회
 *     tags: [Auctions]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 프로필의 고유 식별자
 *     responses:
 *       200:
 *         description: 경매 아이템 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AuctionItem'
 *       404:
 *         description: 프로필을 찾을 수 없음
 */
router.get('/profile/:profileId', auctionController.getAuctionsByProfile);

/**
 * @swagger
 * /auctions/{auctionId}/reports:
 *   post:
 *     summary: 경매 신고
 *     tags: [Auctions]
 *     parameters:
 *       - in: path
 *         name: auctionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: 신고 상세 내용
 *       required: false
 *     responses:
 *       200:
 *         description: 신고 접수됨
 *       404:
 *         description: 경매를 찾을 수 없음
 */
router.post('/:auctionId/reports', auctionController.reportAuctionItem);

/**
 * @swagger
 * /popular-keywords:
 *   get:
 *     summary: 실시간 인기 키워드 랭킹 조회
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: 인기 키워드 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       404:
 *         description: 인기 키워드를 찾을 수 없음
 */

module.exports = router;