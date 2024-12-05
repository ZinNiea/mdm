// controllers/auctionController.js
const { Request, Response } = require('express');
const { AuctionItem } = require('../models/auctionItemModel');
const { Bid } = require('../models/bidModel');

/**
 * 경매 아이템 생성
 * @param {Request} req
 * @param {Response} res
 */
exports.createAuctionItem = async (req, res) => {
  //title, content, category(거래, 나눔, 이벤트), starting_bid, buy_now_price, duration, related,  image_urls, author_id
  // const { title, description, startingPrice, instantBuyPrice, endTime } = req.body;
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
   const endTime = new Date(Date.now() + duration * 60 * 60 * 1000);

   const imageUrls = req.files.map(file => file.location); // S3에서의 이미지 URL

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
      realted: related
    })
    await auctionItem.save();
    res.send('경매 아이템이 생성되었습니다.');
  } catch (err) {
    res.status(400).send(err.message);
  }
};

// 경매 아이템 목록 조회
exports.getAuctionItems = async (req, res) => {
  const { userId } = req.query;
  try {
    const items = await AuctionItem.find().populate('highestBidder', 'username');
    res.send(items);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

// 특정 경매 아이템 조회
exports.getAuctionItemById = async (req, res) => {
  try {
    const item = await AuctionItem.findById(req.params.id).populate('highestBidder', 'username');
    if (!item) return res.status(404).send('아이템을 찾을 수 없습니다.');
    res.send(item);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

// 입찰
exports.placeBid = async (req, res) => {
  try {
    const item = await AuctionItem.findById(req.params.id);
    if (!item) return res.status(404).send('아이템을 찾을 수 없습니다.');
    if (item.endTime < new Date()) return res.status(400).send('경매가 종료되었습니다.');

    const bidAmount = req.body.amount;
    if (bidAmount <= item.currentBid || bidAmount < item.startingPrice) {
      return res.status(400).send('입찰 금액이 너무 낮습니다.');
    }

    item.currentBid = bidAmount;
    item.highestBidder = req.user._id;
    await item.save();

    const bid = new Bid({
      amount: bidAmount,
      bidder: req.user._id,
      auctionItem: item._id
    });
    await bid.save();

    res.send('입찰이 성공적으로 이루어졌습니다.');
  } catch (err) {
    res.status(400).send(err.message);
  }
}

// 즉시구매
exports.instantBuy = async (req, res) => {
  try {
    const item = await AuctionItem.findById(req.params.id);
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
}