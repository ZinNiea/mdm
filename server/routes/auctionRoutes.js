// routes/auction.js
const express = require('express');
const router = express.Router();
const { AuctionItem } = require('../models/auctionItemModel');
const { Bid } = require('../models/bidModel');
const auctionController = require('../controllers/auctionController');
const { upload } = require('../middlewares/uploadMiddleware');

// 경매 아이템 생성
router.post('/', upload.array('images', 5), auctionController.createAuctionItem);

// 경매 아이템 목록 조회
router.get('/', auctionController.getAuctionItems);

// 특정 경매 아이템 조회
router.get('/:auctionId', auctionController.getAuctionItemById);

// 입찰
router.post('/:auctionId/bids', auctionController.placeBid);

// 즉시구매
router.post('/:auctionId/instant-buys', async (req, res) => {
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
});

module.exports = router;