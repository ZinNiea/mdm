// controllers/auctionController.js
const { Request, Response } = require('express');
const { AuctionItem } = require('../models/auctionItemModel');
const { Bid } = require('../models/bidModel');
const { Chat } = require('../models/chatModel');
const { Report } = require('../models/reportModel');
const { profile } = require('winston');
const AWS = require('aws-sdk'); // AWS SDK 추가
const s3 = new AWS.S3();
const { deleteImage } = require('../middlewares/uploadMiddleware'); // deleteImage 함수 추가

/**
 * 경매 아이템 생성
 * @param {Request} req
 * @param {Response} res
 */
exports.createAuctionItem = async (req, res) => {
  const { profileId, title, content, category, startingbid, buyNowPrice, duration, related} = req.body;

  // 카테고리 유효성 검사
  const validCategories = ['거래', '나눔', '이벤트'];
  if (!validCategories.includes(category)) {
    return res.status(400).send('유효하지 않은 카테고리입니다.');
  }

  // 경매 기간 유효성 검사
  if (isNaN(duration) || duration <= 0) {
    return res.status(400).send('유효한 duration 값을 입력해주세요.');
  }

  // duration을 현재 시간에 더하여 endTime 계산 (duration: 시간 단위)
  const createdAt = new Date();
  const endTime = new Date(createdAt.getTime() + duration * 60 * 60 * 1000);
  const imageUrls = req.files.map(file => file.location); // S3에서의 이미지 URL

  try {
    const auctionItem = new AuctionItem({
      title: title,
      description: content,
      category: category,
      startingPrice: startingbid,
      instantBuyPrice: buyNowPrice,
      endTime: endTime,
      createdBy: profileId,
      images: imageUrls,
      related: related,
      createdAt: createdAt
    });
    await auctionItem.save();
    // res.send('경매 아이템이 생성되었습니다.');
    res.status(201).send({ result: true, auctionId: auctionItem._id });
  } catch (err) {
    res.status(400).send(err.message);
  }
};


/**
 * 경매 아이템 목록 조회
 * @param {Request} req 
 * @param {Response} res 
 */
exports.getAuctionItems = async (req, res) => {
  const { q, profileId } = req.query;
  try {
    const items = await AuctionItem.find();

    const now = new Date();

    const data = items.map(item => {
      const duration = Math.max(0, Math.ceil((item.endTime - now) / 1000 / 60 / 60));

      return {
        auctionId: item._id,
        related: item.related,
        title: item.title,
        highest_bid_price: item.currentBid,
        duration: duration,
        views: item.views,
        likes_count: item.likes.length,
        image_urls: item.images ? [item.images[0]] : [],
      };

    });
    res.status(200).send(data);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

/**
 * 특정 경매 아이템 조회
 * @param {Request} req 
 * @param {Response} res 
 * @returns 
 */
exports.getAuctionItemById = async (req, res) => {
  try {
    const item = await AuctionItem.findById(req.params.auctionId)
      .populate('highestBidder', 'username')
      .populate('createdBy', 'nickname profileImage rating');
    if (!item) return res.status(404).send('아이템을 찾을 수 없습니다.');
    const data = {
      authorId: item.createdBy._id,
      authorNickname: item.createdBy.nickname,
      authorImage: item.createdBy.profileImage,
      authorRating: item.createdBy.rating,
      title: item.title,
      content: item.description,
      viewCount: item.views,
      startingBid: item.startingPrice,
      buyNowPrice: item.instantBuyPrice,
      createdAt: item.createdAt,
      endTime: item.endTime,
      related: item.related,
      imageUrls: item.images,
      highestBidPrice: item.currentBid,
      likeCount: item.likes.length,
    };
    res.status(200).send(data);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

/**
 * 입찰
 * @param {Request} req 
 * @param {Response} res 
 * @returns 
 */
exports.placeBid = async (req, res) => {
  const { auctionId } = req.params;
  const { price, profileId } = req.body;
  const amount = price;
  try {
    const item = await AuctionItem.findById(auctionId);
    if (!item) return res.status(404).send('아이템을 찾을 수 없습니다.');
    if (item.endTime < new Date()) return res.status(400).send('경매가 종료되었습니다.');

    const bidAmount = amount;
    if (bidAmount < item.startingPrice || bidAmount <= item.currentBid) {
      return res.status(400).send('입찰 금액이 너무 낮습니다.');
    }

    item.currentBid = bidAmount;
    // item.highestBidder = req.user._id;
    item.highestBidder = profileId;
    await item.save();

    const bid = new Bid({
      amount: bidAmount,
      bidder: profileId,
      auctionItem: item._id,
      bidTime: new Date()
    });
    await bid.save();

    // res.send('입찰이 성공적으로 이루어졌습니다.');
    // res.status(201).send({ result: true });
    // 생성된 입찰의 URI를 응답 헤더에 포함
    res.status(201)
      .location(`/auctions/${item._id}/bids/${bid._id}`)
      .send({ result: true });
  } catch (err) {
    res.status(400).send(err.message);
  }
};


// 공통 채팅방 생성 및 알림 헬퍼 함수 추가
const createChatRoomAndNotify = async (sellerId, bidderId, auctionItemId, io) => {
  const chatRoom = await Chat.create({
    participants: [sellerId, bidderId],
    auctionItem: auctionItemId,
  });

  const roomId = `auction_${chatRoom._id}`;
  chatRoom.roomId = roomId;
  await chatRoom.save();

  // 판매자와 낙찰자에게 채팅방 정보 전송
  io.to(sellerId.toString()).emit('chatRoom', { roomId });
  io.to(bidderId.toString()).emit('chatRoom', { roomId });
};

/**
 * 즉시구매
 * @param {Request} req 
 * @param {Response} res 
 * @returns 
 */
exports.instantBuy = async (req, res) => {
  try {
    const item = await AuctionItem.findById(req.params.auctionId);
    if (!item) return res.status(404).send('아이템을 찾을 수 없습니다.');
    if (item.endTime < new Date()) return res.status(400).send('경매가 종료되었습니다.');
    if (!item.instantBuyPrice) return res.status(400).send('즉시구매가 불가능한 아이템입니다.');

    item.currentBid = item.instantBuyPrice;
    item.highestBidder = req.body.bidder_id;
    item.endTime = new Date(); // 경매 종료
    await item.save();

    const bid = new Bid({
      amount: item.instantBuyPrice,
      bidder: req.body.bidder_id,
      auctionItem: item._id
    });
    await bid.save();

    // 헬퍼 함수 호출하여 채팅방 생성 및 알림
    const io = req.app.get('io');
    await createChatRoomAndNotify(item.createdBy, req.body.bidder_id, item._id, io);

    res.status(201)
      .location(`/auctions/${item._id}/bids/${bid._id}`)
      .send({ result: true });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

/**
 * 경매 즉시 종료
 * @param {Request} req 
 * @param {Response} res 
 * @returns 
 */
exports.endAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const item = await AuctionItem.findById(auctionId).populate('highestBidder');

    if (!item) return res.status(404).send('아이템을 찾을 수 없습니다.');
    if (item.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send('경매를 종료할 권한이 없습니다.');
    }
    if (item.endTime < new Date()) return res.status(400).send('경매가 이미 종료되었습니다.');

    item.endTime = new Date();
    await item.save();

    const io = req.app.get('io');

    if (item.highestBidder) {
      // 헬퍼 함수 호출하여 채팅방 생성 및 알림
      await createChatRoomAndNotify(item.createdBy, item.highestBidder._id, item._id, io);
      res.send('경매가 종료되었습니다. 실시간 채팅방이 생성되었습니다.');
    } else {
      res.send('경매가 종료되었으나, 입찰자가 없습니다.');
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
};

/**
 * 특정 유저가 생성한 경매 목록 조회 (GET /auctions/profile/:profileId)
 * @param {Request} req
 * @param {Response} res
 */
exports.getAuctionsByProfile = async (req, res) => {
  const { profileId } = req.params;
  try {
    const auctions = await AuctionItem.find({ createdBy: profileId })
      .select('title related currentBid endTime views likes images')
      .populate('likes', 'nickname') // 좋아요를 누른 사용자 정보 포함 (필요 시)
      .sort({ createdAt: -1 }); // 최신 순 정렬

    const postList = auctions.map(auction => ({
      auctionId: auction._id,
      related: auction.related,
      title: auction.title,
      highest_bid_price: auction.currentBid,
      endTime: auction.endTime,
      viewCount: auction.views,
      likeCount: auction.likes.length,
      imageUrl: auction.images ? [auction.images[0]] : [],
    }));

    res.status(200).json({ success: true, data: postList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 거래 신고
 * @param {Request} req 
 * @param {Response} res 
 * @returns 
 */
exports.reportAuctionItem = async (req, res) => {
  try {
    const { auctionId } = req.params; // 신고할 게시글 ID
    const { category, content, profileId } = req.body; // 신고 카테고리와 내용
    
    const auctionItem = await AuctionItem.findById(auctionId);
    if (!auctionItem) {
      return res.status(404).json({ result: false, message: '게시물을 찾을 수 없습니다.' });
    }

    const report = new Report({
      auctionItem: auctionItem._id,
      reporter: profileId,
      category: category,
      content: content,
    });
    await report.save();

    res.status(200).json({ result: true, message: '게시글이 신고되었습니다.' });
  } catch (error) {
    res.status(500).json({ result: false, message: error.message });
  }
};

/**
 * 경매 아이템 삭제
 * @param {Request} req
 * @param {Response} res
 */
exports.deleteAuctionItem = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { profileId } = req.body;
    const auctionItem = await AuctionItem.findById(auctionId);

    if (!auctionItem) {
      return res.status(404).send('아이템을 찾을 수 없습니다.');
    }

    if (auctionItem.createdBy.toString() !== profileId.toString()) {
      return res.status(403).send('경매를 삭제할 권한이 없습니다.');
    }

    await AuctionItem.findByIdAndDelete(auctionId);
    res.status(200).json({ message: '경매 아이템이 삭제되었습니다.'});
  } catch (err) {
    res.status(400).send(err.message);
  }
};

/**
 * 경매 아이템 수정
 * @param {Request} req
 * @param {Response} res
 */
exports.updateAuctionItem = async (req, res) => {
  const { auctionId, profileId, title, content, duration } = req.body;
  const imageFiles = req.files;

  try {
    const auctionItem = await AuctionItem.findById(auctionId);
    if (!auctionItem) {
      return res.status(404).send('아이템을 찾을 수 없습니다.');
    }

    if (auctionItem.createdBy.toString() !== profileId.toString()) {
      return res.status(403).send('경매를 수정할 권한이 없습니다.');
    }

    // 기존 이미지 삭제
    const imagesToDelete = auctionItem.images;
    for (const imageUrl of imagesToDelete) {
      await deleteImage(imageUrl);
    }

    // 수정할 필드 업데이트
    if (title) auctionItem.title = title;
    if (content) auctionItem.description = content;
    if (duration && !isNaN(duration) && duration > 0) {
      auctionItem.endTime = new Date(Date.now() + duration * 60 * 60 * 1000);
    }

    // 새로운 이미지 저장
    if (imageFiles && imageFiles.length > 0) {
      const newImageUrls = imageFiles.map(file => file.location);
      auctionItem.images = newImageUrls;
    } else {
      auctionItem.images = [];
    }

    await auctionItem.save();
    res.status(200).send({ result: true, auctionId: auctionItem._id });
  } catch (err) {
    res.status(400).send(err.message);
  }
};