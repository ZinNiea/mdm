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
 *               - images
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
 *                 enum: [거래, 나눔, 과테말라]
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
 *                 description: 업로드할 이미지 파일들 (최대 4개, 각 파일 크기 최대 5MB)
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
 *         description: 요청 데이터가 잘못되었습니다. 필수 필드가 누락되었거나 형식이 올바르지 않습니다.
 *       401:
 *         description: 인증이 필요합니다. 유효한 인증 토큰을 제공해야 합니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
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
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: '경매 아이템 카테고리 필터 (예: 거래, 나눔, 과테말라)'
 *     responses:
 *       200:
 *         description: 경매 아이템 목록을 성공적으로 조회하였습니다.
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
 *         description: 잘못된 쿼리 파라미터가 제공되었습니다.
 *       401:
 *         description: 인증이 필요합니다. 유효한 인증 토큰을 제공해야 합니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.get('/', auctionController.getAuctionItems);

/**
 * @swagger
 * /auctions/{auctionId}:
 *   get:
 *     summary: 특정 경매 아이템 조회
 *     tags: [Auctions]
 *     parameters:
 *       - in: path
 *         name: auctionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 경매 아이템의 고유 ID
 *     responses:
 *       200:
 *         description: 지정된 경매 아이템을 성공적으로 조회하였습니다.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuctionItem'
 *       400:
 *         description: 잘못된 auctionId 형식입니다.
 *       404:
 *         description: 지정된 경매 아이템을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 *   delete:
 *     summary: 경매 아이템 삭제
 *     tags: [Auctions]
 *     parameters:
 *       - in: path
 *         name: auctionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 경매 아이템의 고유 ID
 *     responses:
 *       200:
 *         description: 경매 아이템이 성공적으로 삭제되었습니다.
 *       400:
 *         description: 잘못된 auctionId 형식입니다.
 *       404:
 *         description: 삭제할 경매 아이템을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 *   put:
 *     summary: 경매 아이템 수정
 *     tags: [Auctions]
 *     parameters:
 *       - in: path
 *         name: auctionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 수정할 경매 아이템의 고유 ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [거래, 나눔, 이벤트]
 *               startingbid:
 *                 type: number
 *               buyNowPrice:
 *                 type: number
 *               duration:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: 경매 아이템이 성공적으로 수정되었습니다.
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
 *         description: 요청 데이터가 잘못되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 수정할 경매 아이템을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
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
 *         description: 입찰할 경매 아이템의 고유 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - price
 *               - profileId
 *             properties:
 *               price:
 *                 type: number
 *                 description: 입찰 가격
 *               profileId:
 *                 type: string
 *                 description: 입찰하는 사용자의 프로필 ID
 *     responses:
 *       201:
 *         description: 입찰에 성공하였습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 bidId:
 *                   type: string
 *       400:
 *         description: 요청 데이터가 잘못되었습니다. 필수 필드가 누락되었거나 형식이 올바르지 않습니다.
 *       401:
 *         description: 인증이 필요합니다. 유효한 인증 토큰을 제공해야 합니다.
 *       404:
 *         description: 지정된 경매 아이템을 찾을 수 없습니다.
 *       409:
 *         description: 이미 입찰한 가격이 존재하거나, 입찰 가격이 현재 최고 가격보다 낮습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
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
 *         description: 즉시 구매할 경매 아이템의 고유 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profileId
 *             properties:
 *               profileId:
 *                 type: string
 *                 description: 즉시구매를 진행하는 사용자의 프로필 ID
 *     responses:
 *       201:
 *         description: 즉시 구매가 성공적으로 완료되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: boolean
 *                 purchaseId:
 *                   type: string
 *       400:
 *         description: 요청 데이터가 잘못되었습니다.
 *       404:
 *         description: 지정된 경매 아이템을 찾을 수 없습니다.
 *       409:
 *         description: 해당 경매 아이템은 이미 판매되었거나 종료되었습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
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
 *         description: 종료할 경매 아이템의 고유 ID
 *     responses:
 *       200:
 *         description: 경매가 성공적으로 종료되었습니다.
 *       400:
 *         description: 잘못된 auctionId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 종료할 경매 아이템을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
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
 *         description: 조회할 프로필의 고유 식별자
 *     responses:
 *       200:
 *         description: 지정된 프로필이 생성한 경매 아이템 목록을 성공적으로 조회하였습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AuctionItem'
 *       400:
 *         description: 잘못된 profileId 형식입니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 지정된 프로필을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
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
 *         description: 신고할 경매 아이템의 고유 ID
 *     requestBody:
 *       description: 신고 상세 내용
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 신고 사유
 *               details:
 *                 type: string
 *                 description: 추가 신고 내용
 *     responses:
 *       200:
 *         description: 신고가 성공적으로 접수되었습니다.
 *       400:
 *         description: 요청 데이터가 잘못되었습니다.
 *       401:
 *         description: 인증이 필요합니다.
 *       404:
 *         description: 신고할 경매 아이템을 찾을 수 없습니다.
 *       500:
 *         description: 서버 내부 오류가 발생하였습니다.
 */
router.post('/:auctionId/reports', auctionController.reportAuctionItem);

module.exports = router;