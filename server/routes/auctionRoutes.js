// routes/auction.js
const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const { upload, IMAGE_TYPES } = require('../middlewares/uploadMiddleware');

/**
 * @swagger
 * /auctions:
 *   post:
 *     summary: 경매 아이템 생성
 *     tags: [Auctions]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - profileId
 *               - title
 *               - content
 *               - category
 *               - startingbid
 *               - buyNowPrice
 *               - duration
 *             properties:
 *               profileId:
 *                 type: string
 *                 description: 경매를 생성하는 프로필의 ID
 *               title:
 *                 type: string
 *                 description: 경매 아이템의 제목
 *               content:
 *                 type: string
 *                 description: 경매 아이템의 설명
 *               category:
 *                 type: string
 *                 description: 경매 아이템의 카테고리
 *                 enum: [거래, 나눔, 이벤트]
 *               startingbid:
 *                 type: number
 *                 description: 시작 입찰 가격
 *               buyNowPrice:
 *                 type: number
 *                 description: 즉시 구매 가격
 *               duration:
 *                 type: number
 *                 description: 경매 지속 시간 (시간 단위)
 *               related:
 *                 type: string
 *                 description: 관련 정보
 *               images:
 *                 type: array
 *                 description: 업로드할 이미지 파일들 (최대 4개)
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: 경매 아이템이 성공적으로 생성되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 auctionId:
 *                   type: string
 *       400:
 *         description: 잘못된 요청입니다.
 */
router.post('/', upload(IMAGE_TYPES.AUCTION).array('images', 4), auctionController.createAuctionItem);

/**
 * @swagger
 * /auctions:
 *   get:
 *     summary: 경매 아이템 목록 조회
 *     tags: [Auctions]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: 검색 쿼리
 *       - in: query
 *         name: profileId
 *         schema:
 *           type: string
 *         description: 프로필 ID
 *     responses:
 *       200:
 *         description: 경매 아이템 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   auctionId:
 *                     type: string
 *                     description: 경매 아이템의 ID
 *                   related:
 *                     type: string
 *                     description: 관련 정보
 *                   title:
 *                     type: string
 *                     description: 경매 아이템의 제목
 *                   highest_bid_price:
 *                     type: number
 *                     description: 현재 최고 입찰 가격
 *                   duration:
 *                     type: number
 *                     description: 남은 경매 시간 (시간 단위)
 *                   views:
 *                     type: number
 *                     description: 조회수
 *                   likes_count:
 *                     type: number
 *                     description: 좋아요 개수
 *                   image_urls:
 *                     type: array
 *                     description: 이미지 URL 목록
 *                     items:
 *                       type: string
 *       400:
 *         description: 잘못된 요청입니다.
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: number
 *               profileId:
 *                 type: string
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