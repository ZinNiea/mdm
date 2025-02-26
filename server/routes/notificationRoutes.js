// 파일 경로: server/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const {
    createNotification,
    getNotificationsByProfile,
    markNotificationAsRead,
    getTradeNotifications,
    getCommunityNotifications
} = require('../controllers/notificationController');

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: 새 알림 생성
 *     description: profileId, category, message를 사용하여 새 알림을 생성합니다.
 *     parameters:
 *       - in: body
 *         name: notification
 *         description: 생성할 알림 객체
 *         schema:
 *           type: object
 *           required:
 *             - profileId
 *             - category
 *             - message
 *           properties:
 *             profileId:
 *               type: string
 *             category:
 *               type: string
 *             message:
 *               type: string
 *     responses:
 *       201:
 *         description: 알림 생성 성공
 *       500:
 *         description: 서버 오류
 */
router.post('/', async (req, res) => {
    const { profileId, category, message } = req.body;
    try {
        const notification = await createNotification(profileId, category, message);
        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /notifications/{profileId}:
 *   get:
 *     summary: 특정 프로필의 모든 알림 조회
 *     description: 주어진 profileId에 대한 모든 알림을 가져옵니다.
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 프로필 ID
 *     responses:
 *       200:
 *         description: 알림 조회 성공
 *       500:
 *         description: 서버 오류
 */
router.get('/:profileId', async (req, res) => {
    const { profileId } = req.params;
    try {
        const notifications = await getNotificationsByProfile(profileId);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /notifications/trade/{profileId}:
 *   get:
 *     summary: 거래 관련 알림 조회
 *     description: 주어진 profileId에 해당하는 거래 카테고리 알림을 조회합니다.
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 프로필 ID
 *     responses:
 *       200:
 *         description: 거래 관련 알림 조회 성공
 *       500:
 *         description: 서버 오류
 */
router.get('/trade/:profileId', getTradeNotifications);

/**
 * @swagger
 * /notifications/community/{profileId}:
 *   get:
 *     summary: 커뮤니티 관련 알림 조회
 *     description: 주어진 profileId에 해당하는 커뮤니티 카테고리 알림을 조회합니다.
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 프로필 ID
 *     responses:
 *       200:
 *         description: 커뮤니티 관련 알림 조회 성공
 *       500:
 *         description: 서버 오류
 */
router.get('/community/:profileId', getCommunityNotifications);

/**
 * @swagger
 * /notifications/read/{notificationId}:
 *   put:
 *     summary: 알림 읽음 상태 업데이트
 *     description: 주어진 notificationId의 알림을 읽음 상태로 업데이트합니다.
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 업데이트할 알림의 ID
 *     responses:
 *       200:
 *         description: 알림 업데이트 성공
 *       404:
 *         description: 알림을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.put('/read/:notificationId', async (req, res) => {
    try {
        await markNotificationAsRead(req, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;