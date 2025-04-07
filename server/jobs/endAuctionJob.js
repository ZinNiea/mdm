// 예시: 작업 핸들러 등록 (예: jobs/endAuctionJob.js)
const { AuctionItem } = require('../models/auctionItem.model');
const { Chat } = require('../models/chat.model');
const { createNotification } = require('../controllers/notification.controller');
const { CHAT_CATEGORY } = require('../constants/constants');

module.exports = function (agenda) {
    agenda.define('auction end job', async job => {
        const { auctionItemId } = job.attrs.data;
        const auctionItem = await AuctionItem.findById(auctionItemId);
        if (!auctionItem) return;

        // 경매 종료 시, 입찰자가 있다면 채팅방 생성 및 알림 전송
        if (auctionItem.highestBidder) {
            const newChatRoom = await Chat.create({
                participants: [auctionItem.createdBy, auctionItem.highestBidder],
                category: CHAT_CATEGORY.AUCTION,
                auctionItem: auctionItem._id,
                createdAt: new Date(),
                messages: []
            });
            await createNotification(
                auctionItem.createdBy,
                '거래',
                `경매 종료: '${auctionItem.title}'에 대해 채팅방이 생성되었습니다.`,
                `/trade/${newChatRoom._id}`
            );
            await createNotification(
                auctionItem.highestBidder,
                '거래',
                `경매 종료: '${auctionItem.title}'에 대해 채팅방이 생성되었습니다.`,
                `/trade/${newChatRoom._id}`
            );
        } else {
            // 입찰자가 없는 경우 생성자에게 알림 전송
            await createNotification(
                auctionItem.createdBy,
                '거래',
                `경매 종료: 입찰자가 없습니다.`,
                `/trade/${auctionItem._id}`
            );
        }
    });
};