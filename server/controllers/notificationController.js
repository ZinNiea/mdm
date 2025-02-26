// 예시 파일: server/controllers/notificationController.js
// deeplink, message, createdAT, isRead 
const { Notification } = require('../models/notificationModel');

/**
 * 알림 생성 함수 예시
 * @param {ObjectId} profileId - 알림을 받을 프로필의 ID
 * @param {String} category - 알림 카테고리 ('거래', '커뮤니티', '동행')
 * @param {String} message - 전달할 메시지 내용
 * @param {String} [deepLink=null] - 딥링크 자원
 * @returns 생성된 알림 객체
 */
async function createNotification(profileId, category, message, deepLink = null) {
    try {
        const notification = new Notification({
            profile: profileId,
            category,
            message,
            deepLink  // 추가된 딥링크 필드
        });

        await notification.save();
        return notification;
    } catch (error) {
        throw new Error('알림 생성 중 오류 발생: ' + error.message);
    }
}

/**
 * 특정 프로필의 알림을 조회하는 함수 예시
 * @param {String} profileId - 알림을 조회할 프로필의 ID
 * @returns 해당 프로필의 알림 목록
 */
async function getNotificationsByProfile(profileId) {
    try {
        const notifications = await Notification.find({ profile: profileId })
            .sort({ createdAt: -1 });
        return notifications;
    } catch (error) {
        throw new Error('알림 조회 중 오류 발생: ' + error.message);
    }
}

// 추가: 알림 읽음 상태 업데이트 함수
async function markNotificationAsRead(req, res) {
    try {
        const { notificationId } = req.params;
        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ success: false, message: '알림을 찾을 수 없습니다.' });
        }
        return res.status(200).json({ success: true, data: notification });
    } catch (error) {
        return res.status(500).json({ success: false, message: '알림 업데이트 중 오류 발생: ' + error.message });
    }
}

/**
 * '거래' 카테고리 알림 조회 함수 (특정 profileId 기준)
 * @param {Request} req
 * @param {Response} res
 */
async function getTradeNotifications(req, res) {
    try {
        const { profileId } = req.params;
        const notifications = await Notification.find({
            profile: profileId,
            category: '거래'
        }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, notifications });
    } catch (error) {
        return res.status(500).json({ success: false, message: '알림 조회 중 오류 발생: ' + error.message });
    }
}

/**
 * '커뮤니티' 카테고리 알림 조회 함수 (특정 profileId 기준)
 * @param {Request} req
 * @param {Response} res
 */
async function getCommunityNotifications(req, res) {
    try {
        const { profileId } = req.params;
        const notifications = await Notification.find({
            profile: profileId,
            category: '커뮤니티'
        }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, notifications });
    } catch (error) {
        return res.status(500).json({ success: false, message: '알림 조회 중 오류 발생: ' + error.message });
    }
}

module.exports = {
    createNotification,
    getNotificationsByProfile,
    markNotificationAsRead,
    getTradeNotifications,      // 신규 함수 익스포트
    getCommunityNotifications   // 신규 함수 익스포트
};