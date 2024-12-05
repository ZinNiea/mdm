// controllers/auctionController.js
const { AuctionItem } = require('../models/auctionItemModel');
const { Bid } = require('../models/bidModel');

// 경매 아이템 생성
exports.createAuctionItem = async (req, res) => {
  //title, content, category(거래, 나눔, 이벤트), starting_bid, buy_now_price, duration, related,  image_urls, author_id
  // const { title, description, startingPrice, instantBuyPrice, endTime } = req.body;
  const { title, content, category, starting_bid, buy_now_price, duration, related, image_urls, author_id } = req.body;

  try {
    // const auctionItem = new AuctionItem({
    //   ...req.body,
    //   createdBy: req.user._id
    // });
    const auctionItem = new AuctionItem({
      // title: req.body.title,
      // description: req.body.contnet,
      // startingPrice: req.body.startingPrice,
      // instantBuyPrice: req.body.instantBuyPrice,
      // endTime: req.body.endTime,
      // createdBy: req.user._id
      title: title,
      description: content,
      startingPrice: starting_bid,
      instantBuyPrice: buy_now_price,
      endTime: duration,
      createdBy: author_id
    })
    await auctionItem.save();
    res.send('경매 아이템이 생성되었습니다.');
  } catch (err) {
    res.status(400).send(err.message);
  }
};

// 경매 아이템 목록 조회
exports.getAuctionItems = async (req, res) => {
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