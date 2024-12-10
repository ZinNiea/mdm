// controllers/auctionController.js
const { Request, Response } = require('express');
const { AuctionItem } = require('../models/auctionItemModel');
const { Bid } = require('../models/bidModel');
const { Chat } = require('../models/chatModel');

/**
 * 경매 아이템 생성
 * @param {Request} req
 * @param {Response} res
 */
exports.createAuctionItem = async (req, res) => {
  const { title, content, category, starting_bid, buy_now_price, duration, related, author_id } = req.body;

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
  const imageUrls = req.files.map(file => file.location); // S3에서의 이미�� URL

  try {
    const auctionItem = new AuctionItem({
      title: title,
      description: content,
      category: category,
      startingPrice: starting_bid,
      instantBuyPrice: buy_now_price,
      endTime: endTime,
      createdBy: author_id,
      images: imageUrls,
      related: related,
      createdAt: createdAt
    });
    await auctionItem.save();
    // res.send('경매 아이템이 생성되었습니다.');
    res.status(201).send({ result: true });
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
  const { amount, bidder_id } = req.body;
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
    item.highestBidder = req.body.bidder_id;
    await item.save();

    const bid = new Bid({
      amount: bidAmount,
      // bidder: req.user._id,
      bidder: req.body.bidder_id,
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
    item.highestBidder = req.user._id;
    item.endTime = new Date(); // 경매 종료
    await item.save();

    const bid = new Bid({
      amount: item.instantBuyPrice,
      bidder: req.user._id,
      auctionItem: item._id
    });
    await bid.save();

    res.send('즉시구매가 완료되었습니다.');
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
    const auctionId = req.params.auctionId;
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
      // 낙찰자에게 알림 또는 추가 로직 수행
      const chatRoom = await Chat.create({
        participants: [item.createdBy, item.highestBidder._id],
        auctionItem: item._id,
      });

      const roomId = `auction_${chatRoom._id}`;

      // 채팅방 ID를 설정 (예: 경매 ID 사용 가능)
      chatRoom.roomId = roomId;
      await chatRoom.save();

      // 판매자와 낙찰자에게 채팅방 정보 전송
      io.to(item.createdBy.toString()).emit('chatRoom', { roomId });
      io.to(item.highestBidder._id.toString()).emit('chatRoom', { roomId });

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
exports.getAuctionsByUser = async (req, res) => {
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