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

// 거래 알림 생성
async function createTransactionNotification(profileId, type, data) {
    try {
        const notification = new Notification({
            profile: profileId,
            type,          // 거래 알림 종류 (예:"NEW_BID_ON_AUCTION", "OUTBID", ...)
            data,          // 상황별로 필요한 데이터 (auctionId, auctionTitle, 등)
            category: '거래'
        });
        await notification.save();
        return notification;
    } catch (error) {
        throw new Error('거래 알림 생성 중 오류 발생: ' + error.message);
    }
}

// 거래 알림 생성 관련 헬퍼 함수들
async function createNewBidOnAuctionNotification(profileId, auctionId, auctionTitle, nickname, price) {
    return createTransactionNotification(profileId, "NEW_BID_ON_AUCTION", { auctionId, auctionTitle, nickname, price });
}
async function createOutbidNotification(profileId, auctionId, auctionTitle, nickname, price) {
    return createTransactionNotification(profileId, "OUTBID", { auctionId, auctionTitle, nickname, price });
}
async function createAuctionEndingSoonNotification(profileId, auctionId, auctionTitle, price) {
    return createTransactionNotification(profileId, "AUCTION_ENDING_SOON", { auctionId, auctionTitle, price });
}
async function createAuctionEndedNotification(profileId, auctionId, auctionTitle, finalPrice, nickname, roomId) {
    return createTransactionNotification(profileId, "AUCTION_ENDED", { auctionId, auctionTitle, finalPrice, nickname, roomId });
}
async function createAuctionWonNotification(profileId, auctionId, auctionTitle, price, sellerNickname) {
    return createTransactionNotification(profileId, "AUCTION_WON", { auctionId, auctionTitle, price, sellerNickname });
}

// 커뮤니티 알림 생성 관련 함수
async function createTransactionNotification(profileId, type, data) {
    try {
        const notification = new Notification({
            profile: profileId,
            type,          // 거래 알림 종류 (예:"NEW_BID_ON_AUCTION", "OUTBID", ...)
            data,          // 상황별로 필요한 데이터 (auctionId, auctionTitle, 등)
            category: '거래',
            message: `[${type}] 거래 알림`  // 기본 메시지 추가
        });
        await notification.save();
        return notification;
    } catch (error) {
        throw new Error('거래 알림 생성 중 오류 발생: ' + error.message);
    }
}
async function createNewFollowerNotification(profileId, followerProfileId, profileName) {
    return createCommunityNotification(profileId, "NEW_FOLLOWER", { profileId: followerProfileId, profileName });
}
async function createNewLikeOnPostNotification(profileId, profileName, postId, postContent) {
    return createCommunityNotification(profileId, "NEW_LIKE_ON_POST", { profileName, postId, postContent });
}
async function createNewCommentOnPostNotification(profileId, profileName, postId, commentId, commentContent) {
    return createCommunityNotification(profileId, "NEW_COMMENT_ON_POST", { profileName, postId, commentId, commentContent });
}
async function createNewReplyOnCommentNotification(profileId, profileName, postId, replyId, replyContent) {
    return createCommunityNotification(profileId, "NEW_REPLY_ON_COMMENT", { profileName, postId, replyId, replyContent });
}

// 거래 관련 알림 조회
exports.getTransactionNotifications = async (req, res) => {
    try {
        const { profileId } = req.params;
        const transactionTypes = [
            "NEW_BID_ON_AUCTION",   // 나의 거래글에 새로운 입찰 생성
            "OUTBID",               // 내가 최고입찰자였으나 새로운 입찰 발생
            "AUCTION_ENDING_SOON",  // 거래 종료 3시간 전 알림
            "AUCTION_ENDED",        // 내가 올린 거래 종료 및 채팅방 생성
            "AUCTION_WON"           // 내 입찰이 낙찰됨
        ];
        // 해당 프로필의 거래 관련 알림을 조회
        const notifications = await Notification.find({
            profile: profileId,
            type: { $in: transactionTypes }
        }).sort({ createdAt: -1 });

        const formatted = notifications.map(n => {
            let data = {};
            switch (n.type) {
                case "NEW_BID_ON_AUCTION":
                case "OUTBID":
                    data = {
                        auctionId: n.data.auctionId,
                        auctionTitle: n.data.auctionTitle,
                        nickname: n.data.nickname,
                        price: n.data.price
                    };
                    break;
                case "AUCTION_ENDING_SOON":
                    data = {
                        auctionId: n.data.auctionId,
                        auctionTitle: n.data.auctionTitle,
                        price: n.data.price
                    };
                    break;
                case "AUCTION_ENDED":
                    data = {
                        auctionId: n.data.auctionId,
                        auctionTitle: n.data.auctionTitle,
                        finalPrice: n.data.finalPrice,
                        nickname: n.data.nickname,
                        roomId: n.data.roomId
                    };
                    break;
                case "AUCTION_WON":
                    data = {
                        auctionId: n.data.auctionId,
                        auctionTitle: n.data.auctionTitle,
                        price: n.data.price,
                        sellerNickname: n.data.sellerNickname
                    };
                    break;
                default:
                    data = n.data;
            }
            return {
                id: n._id,
                type: n.type,
                data,
                createdAt: n.createdAt,
                read: n.read
            };
        });

        res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 커뮤니티 관련 알림 조회
exports.getCommunityNotifications = async (req, res) => {
    try {
        const { profileId } = req.params;
        const communityTypes = [
            "NEW_FOLLOWER",         // 누군가 나를 팔로우
            "NEW_LIKE_ON_POST",     // 내 게시글에 좋아요
            "NEW_COMMENT_ON_POST",  // 내 게시글에 댓글 작성
            "NEW_REPLY_ON_COMMENT"  // 내 댓글에 대댓글 작성
        ];
        // 해당 프로필의 커뮤니티 관련 알림을 조회
        const notifications = await Notification.find({
            profile: profileId,
            type: { $in: communityTypes }
        }).sort({ createdAt: -1 });

        const formatted = notifications.map(n => {
            let data = {};
            switch (n.type) {
                case "NEW_FOLLOWER":
                    data = {
                        profileId: n.data.profileId,
                        profileName: n.data.profileName
                    };
                    break;
                case "NEW_LIKE_ON_POST":
                    data = {
                        profileName: n.data.profileName,
                        postId: n.data.postId,
                        postContent: n.data.postContent
                    };
                    break;
                case "NEW_COMMENT_ON_POST":
                    data = {
                        profileName: n.data.profileName,
                        postId: n.data.postId,
                        commentId: n.data.commentId,
                        commentContent: n.data.commentContent
                    };
                    break;
                case "NEW_REPLY_ON_COMMENT":
                    data = {
                        profileName: n.data.profileName,
                        postId: n.data.postId,
                        replyId: n.data.replyId,
                        replyContent: n.data.replyContent
                    };
                    break;
                default:
                    data = n.data;
            }
            return {
                id: n._id,
                type: n.type,
                data,
                createdAt: n.createdAt,
                read: n.read
            };
        });

        res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createNotification,
    getNotificationsByProfile,
    createTransactionNotification,
    createNewBidOnAuctionNotification,
    createOutbidNotification,
    createAuctionEndingSoonNotification,
    createAuctionEndedNotification,
    createAuctionWonNotification,
    createNewFollowerNotification,
    createNewLikeOnPostNotification,
    createNewCommentOnPostNotification,
    createNewReplyOnCommentNotification
};