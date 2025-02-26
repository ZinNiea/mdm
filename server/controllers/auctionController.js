// controllers/auctionController.js
const { Request, Response } = require('express');
const { AuctionItem } = require('../models/auctionItemModel');
const { Bid } = require('../models/bidModel');
const { Chat } = require('../models/chatModel');
const { Report } = require('../models/reportModel');
const { deleteImage } = require('../middlewares/uploadMiddleware'); // deleteImage 함수 추가
const schedule = require('node-schedule'); // node-schedule 라이브러리 추가
const { CHAT_CATEGORY } = require('../models/constants'); // 상수 불러오기
const { createNewBidOnAuctionNotification, createAuctionEndedNotification, createAuctionWonNotification, createAuctionEndingSoonNotification, createOutbidNotification } = require('../controllers/notificationController'); // 알림 함수 추가
const { Profile } = require('../models/profileModel'); // 추가

// 경매 종료 함수 정의
const endAuctionJob = async (auctionId, io) => {
  try {
    const item = await AuctionItem.findById(auctionId);
    if (item && item.endTime > new Date()) {
      item.endTime = new Date();
      await item.save();

      if (item.highestBidder) {
        await createChatRoomAndNotify(item.createdBy, item.highestBidder, item._id, io);
      }
    }
  } catch (err) {
    console.error(`경매 종료 실패: ${err.message}`);
  }
};

/**
 * 경매 아이템 생성
 * @param {Request} req
 * @param {Response} res
 */
exports.createAuctionItem = async (req, res) => {
  const { profileId, title, content, category, startingbid, buyNowPrice, duration, related } = req.body;

  // 요청 파라미터 검증 추가
  if (!profileId || typeof profileId !== 'string') {
    return res.status(400).send('유효하지 않은 profileId입니다.');
  }
  if (!title || typeof title !== 'string') {
    return res.status(400).send('유효하지 않은 title입니다.');
  }
  if (!content || typeof content !== 'string') {
    return res.status(400).send('유효하지 않은 content입니다.');
  }
  const validCategories = ['거래', '나눔', '과테말라'];
  if (!category || !validCategories.includes(category)) {
    return res.status(400).send('유효하지 않은 category입니다.');
  }
  if (isNaN(startingbid) || startingbid <= 0) {
    return res.status(400).send('유효하지 않은 startingbid입니다.');
  }
  if (isNaN(buyNowPrice) || buyNowPrice <= 0) {
    return res.status(400).send('유효하지 않은 buyNowPrice입니다.');
  }
  if (isNaN(duration) || duration <= 0) {
    return res.status(400).send('유효하지 않은 duration입니다.');
  }

  // 이미지 파일 검증 추가
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('이미지 파일이 필요합니다.');
  }
  if (req.files.length > 4) {
    return res.status(400).send('이미지 파일은 최대 4개까지 업로드할 수 있습니다.');
  }
  for (const file of req.files) {
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).send('유효하지 않은 이미지 파일입니다.');
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB 제한
      return res.status(400).send('이미지 파일 크기는 5MB를 초과할 수 없습니다.');
    }
  }

  // duration 현재 시간에 더하여 endTime 계산 (duration: 시간 단위)
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

    // node-schedule을 사용하여 경매 종료 작업 스케줄링
    schedule.scheduleJob(endTime, () => {
      const io = req.app.get('io'); // io 인스턴스 가져오기
      endAuctionJob(auctionItem._id, io);
    });

    // AUCTION_ENDING_SOON 알림 스케줄링: 경매 종료 3시간 전에 알림 전송 (경매 지속시간이 3시간 이상인 경우)
    const threeHours = 3 * 60 * 60 * 1000;
    if (endTime - createdAt > threeHours) {
      const endingSoonTime = new Date(endTime.getTime() - threeHours);
      schedule.scheduleJob(endingSoonTime, async () => {
        // 해당 경매의 모든 입찰자를 고유하게 조회
        const bids = await Bid.find({ auctionItem: auctionItem._id });
        const uniqueBidders = [...new Set(bids.map(b => b.bidder.toString()))];
        for (const bidderId of uniqueBidders) {
          // 현재 입찰 금액을 기준으로 알림 전송 (auctionTitle, currentBid)
          await createAuctionEndingSoonNotification(
            bidderId,
            auctionItem._id,
            auctionItem.title,
            auctionItem.currentBid,
            `/auction/${auctionItem._id}` // 생성된 딥링크
          );
        }
      });
    }

    res.status(201).send({ result: true, auctionId: auctionItem._id });
  } catch (err) {
    res.status(500).send(err.message);
  }
};


/**
 * 경매 아이템 목록 조회
 * @param {Request} req 
 * @param {Response} res 
 */
exports.getAuctionItems = async (req, res) => {
  const { q, category, profileId } = req.query;
  try {
    let filter = {};
    if (q) { // 자동완성 적용 후 최종 검색어
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    if (category) {
      filter.category = category;  // category 검색조건 추가
    }

    const items = await AuctionItem.find(filter); // 수정된 filter 적용

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
        category: item.category // 카테고리 정보 추가
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
      .populate('highestBidder', 'nickname')
      .populate('createdBy', 'nickname profileImage rating');
    if (!item) return res.status(404).send('아이템을 찾을 수 없습니다.');

    item.views += 1;
    await item.save();

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
      highestBiddersNickname: item.highestBidder ? item.highestBidder.nickname : null,
      likeCount: item.likes.length,
      category: item.category // 카테고리 정보 추가
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
  // bidderNickname 제거: 프로필 조회로 대체
  const { price, profileId } = req.body;
  try {
    const item = await AuctionItem.findById(auctionId);
    if (!item) return res.status(404).send('아이템을 찾을 수 없습니다.');
    if (item.endTime < new Date()) return res.status(400).send('경매가 종료되었습니다.');

    const bidAmount = price;
    if (bidAmount < item.startingPrice || bidAmount <= item.currentBid) {
      return res.status(400).send('입찰 금액이 너무 낮습니다.');
    }

    // 입찰 전 이전 최고 입찰자 저장
    const previousHighestBidder = item.highestBidder;

    // 입찰자의 닉네임을 profileId로 조회
    const bidderProfile = await Profile.findById(profileId);
    if (!bidderProfile) return res.status(404).send('입찰자 프로필을 찾을 수 없습니다.');
    const bidderNickname = bidderProfile.nickname;

    item.currentBid = bidAmount;
    item.highestBidder = profileId;
    await item.save();

    const bid = new Bid({
      amount: bidAmount,
      bidder: profileId,
      auctionItem: item._id,
      bidTime: new Date()
    });
    await bid.save();

    // 이전 최고 입찰자가 존재하고 새로운 입찰자와 다른 경우 OUTBID 알림 생성
    if (previousHighestBidder && previousHighestBidder.toString() !== profileId.toString()) {
      const previousBidderProfile = await Profile.findById(previousHighestBidder);
      if (previousBidderProfile) {
        await createOutbidNotification(
          previousHighestBidder,           // 이전 최고 입찰자 프로필 ID
          item._id,                        // 경매 아이템 ID
          item.title,                      // 경매 제목
          previousBidderProfile.nickname,  // 이전 입찰자 닉네임
          bidAmount,                       // 새로운 입찰 금액
          `/auction/${item._id}`           // 생성된 딥링크
        );
      }
    }

    // NEW_BID_ON_AUCTION 알림 생성: 경매글 작성자(item.createdBy)에게 알림 전송
    await createNewBidOnAuctionNotification(
      item.createdBy,     // 알림을 받을 프로필
      item._id,           // 경매 아이템 ID
      item.title,         // 경매 글 제목
      bidderNickname,     // 프로필 조회로 가져온 입찰자 닉네임
      bidAmount,          // 입찰 금액
      `/auction/${item._id}` // 생성된 딥링크
    );

    res.status(201)
      .location(`/auctions/${item._id}/bids/${bid._id}`)
      .send({ result: true });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ result: false, message: '유효하지 않은 토큰입니다.' });
    }
    res.status(500).json({ result: false, message: err.message });
  }
};


// 수정: createChatRoomAndNotify 함수를 수정하여 roomId 반환
const createChatRoomAndNotify = async (sellerId, bidderId, auctionItemId, io) => {
  const chatRoom = await Chat.create({
    participants: [sellerId, bidderId],
    auctionItem: auctionItemId,
    category: CHAT_CATEGORY.AUCTION, // 상수 사용
    messages: [],
    createdAt: new Date()
  });
  const roomId = chatRoom._id.toString();
  io.to(sellerId.toString()).emit('chatRoom', { roomId });
  io.to(bidderId.toString()).emit('chatRoom', { roomId });
  return roomId;
};

/**
 * 즉시구매
 * @param {Request} req 
 * @param {Response} res 
 * @returns 
 */
exports.instantBuy = async (req, res) => {
  const { profileId } = req.body;
  try {
    const item = await AuctionItem.findById(req.params.auctionId);
    if (!item) return res.status(404).send('아이템을 찾을 수 없습니다.');
    if (item.endTime < new Date()) return res.status(400).send('경매가 종료되었습니다.');
    if (!item.instantBuyPrice) return res.status(400).send('즉시구매가 불가능한 아이템입니다.');

    item.currentBid = item.instantBuyPrice;
    item.highestBidder = profileId;
    item.endTime = new Date(); // 경매 종료 처리
    await item.save();

    const bid = new Bid({
      amount: item.instantBuyPrice,
      bidder: profileId,
      auctionItem: item._id
    });
    await bid.save();

    // 헬퍼 함수 호출하여 채팅방 생성 및 알림 전송
    const io = req.app.get('io');
    await createChatRoomAndNotify(item.createdBy, item.highestBidder, item._id, io);

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

    // 유효한 ObjectId인지 검증 (선택 사항)
    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 경매 ID입니다.' });
    }

    const item = await AuctionItem.findById(auctionId).populate('highestBidder');

    if (!item) {
      return res.status(404).json({ success: false, message: '경매 아이템을 찾을 수 없습니다.' });
    }

    // 인증된 사용자인지 확인 (미들웨어에서 처리되지 않은 경우)
    // if (!req.user || item.createdBy.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({ success: false, message: '경매를 종료할 권한이 없습니다.' });
    // }

    if (item.endTime < new Date()) {
      return res.status(409).json({ success: false, message: '경매가 이미 종료되었습니다.' });
    }

    item.endTime = new Date();
    await item.save();

    const io = req.app.get('io');

    if (item.highestBidder) {
      // 수정: 채팅방 생성 및 roomId 반환
      const roomId = await createChatRoomAndNotify(item.createdBy, item.highestBidder._id, item._id, io);
      // 최고 입찰자의 닉네임 조회
      const highestBidderProfile = await Profile.findById(item.highestBidder._id);
      // AUCTION_ENDED 알림 호출: 판매자에게 최종 가격, 입찰자 닉네임, 채팅방 ID 포함
      await createAuctionEndedNotification(
        item.createdBy,
        item._id,
        item.title,
        item.currentBid,
        highestBidderProfile.nickname,
        roomId,
        `/auction/${item._id}` // 생성된 딥링크
      );
      // 추가: AUCTION_WON 알림: 낙찰된 (최고 입찰자)에게 판매자의 닉네임 포함 알림 전송
      const sellerProfile = await Profile.findById(item.createdBy);
      await createAuctionWonNotification(
        item.highestBidder._id,  // 낙찰된 사람(최고 입찰자)
        item._id,
        item.title,
        item.currentBid,
        sellerProfile.nickname,
        `/auction/${item._id}` // 생성된 딥링크
      );
      return res.status(200).json({
        success: true,
        message: '경매가 종료되었으며, 실시간 채팅방과 거래 종료 및 낙찰 알림이 생성되었습니다.'
      });
    } else {
      return res.status(200).json({
        success: true,
        message: '경매가 종료되었으나, 입찰자가 없습니다.'
      });
    }
  } catch (err) {
    console.error(`경매 즉시 종료 오류: ${err.message}`);
    return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
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
    res.status(200).json({ message: '경매 아이템이 삭제되었습니다.' });
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
  const { auctionId, profileId, title, content, duration, buyNowPrice } = req.body;
  const imageFiles = req.files;

  // 요청 파라미터 검증 추가
  if (!auctionId || typeof auctionId !== 'string') {
    return res.status(400).send('유효하지 않은 auctionId입니다.');
  }
  if (!profileId || typeof profileId !== 'string') {
    return res.status(400).send('유효하지 않은 profileId입니다.');
  }
  if (title && typeof title !== 'string') {
    return res.status(400).send('유효하지 않은 title입니다.');
  }
  if (content && typeof content !== 'string') {
    return res.status(400).send('유효하지 않은 content입니다.');
  }
  if (duration && (isNaN(duration) || duration <= 0)) {
    return res.status(400).send('유효하지 않은 duration입니다.');
  }
  if (buyNowPrice && (isNaN(buyNowPrice) || buyNowPrice <= 0)) {
    return res.status(400).send('유효하지 않은 buyNowPrice입니다.');
  }

  // 이미지 파일 검증 추가
  if (imageFiles && imageFiles.length > 4) {
    return res.status(400).send('이미지 파일은 최대 4개까지 업로드할 수 있습니다.');
  }
  if (imageFiles) {
    for (const file of imageFiles) {
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).send('유효하지 않은 이미지 파일입니다.');
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB 제한
        return res.status(400).send('이미지 파일 크기는 5MB를 초과할 수 없습니다.');
      }
    }
  }

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
    if (buyNowPrice) auctionItem.instantBuyPrice = buyNowPrice;

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