// 예시 파일: server/controllers/notificationController.js

const { Notification } = require('../models/notificationModel');

/**
 * 알림 생성 함수 예시
 * @param {String} profileId - 알림을 받을 프로필의 ID
 * @param {String} category - 알림 카테고리 ('거래', '커뮤니티', '동행')
 * @param {String} message - 전달할 메시지 내용
 * @returns 생성된 알림 객체
 */
async function createNotification(profileId, category, message) {
    try {
        const notification = new Notification({
            profile: profileId,
            category,
            message,
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

module.exports = { createNotification, getNotificationsByProfile };