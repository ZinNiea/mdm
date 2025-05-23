// server/controllers/postController.js
require('dotenv').config();
const { Post } = require('../models/postModel');
const { User } = require('../models/userModel');
const { Profile } = require('../models/profileModel');
const { Report } = require('../models/reportModel');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;
const { MODELS } = require('../models/constants');
const { ViewLog } = require('../models/viewLogModel');
const mongoose = require('mongoose');
const { createNotification } = require('../controllers/notificationController'); // 추가
const { Comment } = require('../models/commentModel'); // 신규 추가: 댓글 모델 import
const { SearchLog } = require('../models/searchLogModel'); // 신규 추가: 검색어 모델 import


function verifyTokenAndGetUserId(req) {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) throw new Error('인증 토큰이 필요합니다.');
  const decoded = jwt.verify(token, SECRET_KEY);
  return decoded.id;
}

async function findPostOrFail(postId) {
  const post = await Post.findById(postId);
  if (!post) throw new Error('게시물을 찾을 수 없습니다.');
  return post;
}

exports.getPosts = async (req, res) => {
  const { category, q, profileId } = req.query;
  let filter = {};

  // 카테고리 필터링 (문자열을 숫자로 변환)
  switch (category) {
    case '친구':
    case 'friends':
    case '1':
      filter.category = 1;
      break;
    case '과테말라':
    case 'guatemala':
    case '2':
      filter.category = 2;
      break;
    case '전체':
    case 'public':
    case '3':
      filter.category = 3;
      break;
  }

  // 검색어 필터 (대소문자 구분 없이 content 필드 검색)
  if (q) {
    const searchLog = new SearchLog({ keyword: q });
    await searchLog.save();

    filter.content = { $regex: q, $options: 'i' };
  }

  // profileId를 ObjectId로 변환 (게시물 좋아요/북마크 계산에 사용)
  const currentProfileId = profileId && mongoose.Types.ObjectId.isValid(profileId)
    ? new mongoose.Types.ObjectId(profileId)
    : null;

  try {
    const posts = await Post.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'profiles',
          localField: 'author',
          foreignField: '_id',
          as: 'authorInfo'
        }
      },
      { $unwind: '$authorInfo' },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'postId',
          as: 'comments'
        }
      },
      { $addFields: { commentCount: { $size: '$comments' } } },
      {
        $addFields: {
          likeStatus: currentProfileId
            ? { $in: [currentProfileId, { $ifNull: ["$likes", []] }] }
            : false,
          bookmarkStatus: currentProfileId
            ? { $in: [currentProfileId, { $ifNull: ["$bookmarks", []] }] }
            : false
        }
      },
      {
        $project: {
          id: "$_id", // 기존 _id 값을 id로 반환합니다.
          content: 1,
          createdAt: 1,
          images: 1,
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          commentCount: 1,
          authorId: "$authorInfo._id",
          authorNickname: "$authorInfo.nickname",
          likeStatus: 1,
          bookmarkCount: { $size: { $ifNull: ["$bookmarks", []] } },
          bookmarkStatus: 1,
          _id: 0 // _id 필드를 제거합니다.
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 설명: getPostById 함수는 특정 게시물을 조회하는 API 엔드포인트를 처리합니다.
exports.getPostById = async (req, res) => {
  try {
    // const userId = verifyTokenAndGetUserId(req);
    const profileId = req.query.profileId; // profileId 정의 추가
    const postId = req.params.postId; // postId 정의 추가
    const post = await Post.findById(postId)
      .populate('author', 'nickname profileImage'); // author 필드 populate 추가

    if (!post) {
      return res.status(404).json({ success: false, message: '게시물을 찾을 수 없습니다.' });
    }

    // 조회수 증가
    post.viewCount += 1;
    await post.save();

    // 조회 로그 기록
    await ViewLog.create({ post: post._id });

    // 댓글 수 집계를 aggregate 파이프라인으로 변경
    const commentsAgg = await Comment.aggregate([
      { $match: { postId: post._id } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    const commentCount = commentsAgg.length ? commentsAgg[0].count : 0;

    // 게시물 정보를 응답으로 반환합니다.
    res.status(200).json({
      success: true,
      data: {
        postId: post._id,
        content: post.content,
        authorId: post.author._id,
        authorNickname: post.author.nickname,
        authorImage: post.author.profileImage,
        createdAt: post.createdAt,
        likesCount: post.likes.length,
        likeStatus: post.likes.includes(profileId),
        commentCount, // aggregate로 계산한 댓글 수
        bookmarkCount: post.bookmarks.length, // 수정된 코드
        bookmarkStatus: post.bookmarks.includes(profileId), // 수정된 코드
        images: post.images, // 이미지 목록 추가
      }
    });
  } catch (error) {
    console.error(error);
    // 토큰 검증 오류인 경우 401 상태 코드와 함께 메시지를 반환합니다.
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
    }
    // 기타 서버 오류인 경우 500 상태 코드와 함께 오류 메시지를 반환합니다.
    res.status(500).json({ success: false, message: error.message });
  }
};

// 게시물 작성
exports.createPost = async (req, res) => {
  try {
    const userId = verifyTokenAndGetUserId(req);
    let { content, category, profileId } = req.body;
    const images = req.files ? req.files.map(file => file.location) : [];

    // category가 문자열일 경우 숫자로 변환
    switch (category) {
      case '친구':
      case 'friends':
      case '1':
        category = 1;
        break;
      case '과테말라':
      case 'guatemala':
      case '2':
        category = 2;
        break;
      case '전체':
      case 'public':
      case '3':
        category = 3;
        break;
    }

    // 프로필 소유자 검증
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '유저를 찾을 수 없습니다.' });
    }

    // const profile = user.profiles.id(profileId);
    const profile = user.profiles.includes(profileId);
    if (!profile) {
      return res.status(404).json({ success: false, message: '프로필을 찾을 수 없습니다.' });
    }

    // 카테고리 유효성 검사
    if (!Object.values(Post.CATEGORY).includes(category)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 카테고리입니다.' });
    }

    // 이미지 개수 제한 확인
    if (images.length > 5) {
      return res.status(400).json({ success: false, message: '이미지는 최대 5장까지 업로드 가능합니다.' });
    }

    const newPost = await Post.create({
      author: profileId,
      content: content,
      images: images,
      category: category,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({ success: true, data: newPost });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// 게시물 수정
exports.updatePost = async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const images = req.files ? req.files.map(file => file.location) : [];

  try {
    const post = await findPostOrFail(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: '게시물을 찾을 수 없습니다.' });
    }

    post.content = content || post.content;
    // 이미지 업데이트
    if (images && images.length > 0) {
      // 기존 이미지 삭제 로직 추가 (필요 시)
      // 예: 기존 이미지를 스토리지에서 삭제

      // 기존 이미지와 새 이미지의 합이 5개를 초과하지 않는지 확인
      const totalImages = post.images.length + images.length;
      if (totalImages > 5) {
        return res.status(400).json({ success: false, message: '이미지는 최대 5장까지 업로드 가능합니다.' });
      }

      // 기존 이미지를 유지하면서 새 이미지를 추가
      post.images = post.images.concat(images.map(file => file.path));
    }

    post.updatedAt = new Date();

    await post.save();

    res.status(200).json({ success: true, data: post });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// 게시물 삭제
exports.deletePost = async (req, res) => {
  const { postId } = req.params;

  try {
    // const post = await findPostOrFail(postId);
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: '게시물을 찾을 수 없습니다.' });
    }

    await Post.findByIdAndDelete(postId);

    res.status(200).json({ success: true, message: '게시물이 성공적으로 삭제되었습니다.' });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// 게시물 신고
exports.reportPost = async (req, res) => {
  try {
    const { postId } = req.params; // 신고할 게시글 ID
    const { category, content, profileId } = req.body; // 신고 카테고리와 내용

    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ result: false, message: '게시물을 찾을 수 없습니다.' });
    }

    // 새로운 신고 생성
    const report = new Report({
      post: post._id,
      reporter: profileId,
      category: category,
      content: content,
    });
    await report.save();

    res.status(200).json({ result: true, message: '게시글이 신고되었습니다.' });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ result: false, message: '유효하지 않은 토큰입니다.' });
    }
    res.status(500).json({ result: false, message: err.message });
  }
};

// 좋아요/좋아요 취소
exports.toggleLike = async (req, res) => {
  const { postId } = req.params;
  // const { profileId } = req.body;
  const profileId = req.body.profileId; //!< 행동을 수행하고 있는 프로필 ID


  try {
    const userId = verifyTokenAndGetUserId(req);
    const post = await Post.findById(postId);

    // 좋아요 취소인 경우
    if (post.likes.includes(profileId)) {
      post.likes.pull(profileId);
      await post.save();
      return res.status(200).json({ result: true, message: '좋아요를 취소했습니다.' });
    } else {
      // 좋아요 추가
      post.likes.push(profileId);
      await post.save();

      const likingProfile = await Profile.findById(profileId);
      const authorProfile = await Profile.findById(post.author);

      if (authorProfile) {
        await createNotification(
          authorProfile._id,
          '커뮤니티',
          `${likingProfile.nickname}님이 회원님의 게시물을 좋아합니다. ${post.content}`,
          `community/${postId}`
        )
      }
      return res.status(200).json({ result: true, message: '게시물에 좋아요를 표시했습니다.' });
    }
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ result: false, message: '유효하지 않은 토큰입니다.' });
    }
    res.status(500).json({ result: false, message: err.message });
  }
};

// 게시물 북마크 추가/취소
exports.toggleBookmark = async (req, res) => {
  const { postId } = req.params;
  const { profileId } = req.body;

  if (!profileId) {
    return res.status(400).json({ result: false, message: '프로필 ID가 필요합니다.' });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ result: false, message: '게시물을 찾을 수 없습니다.' });
    }
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ result: false, message: '프로필을 찾을 수 없습니다.' });
    }

    if (profile.bookmarks.includes(postId)) {
      profile.bookmarks.pull(postId);
      post.bookmarks.pull(profileId); // Post.bookmarks 업데이트
      await profile.save();
      await post.save();
      return res.status(200).json({ result: true, message: '북마크가 취소되었습니다.' });
    } else {
      profile.bookmarks.push(postId);
      post.bookmarks.push(profileId); // Post.bookmarks 업데이트
      await profile.save();
      await post.save();
      return res.status(200).json({ result: true, message: '게시물이 북마크에 추가되었습니다.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ result: false, message: '북마크 처리에 실패했습니다.', error });
  }
};

// 관심사 추가
exports.addInterest = async (req, res) => {
  const { userId, profileId } = req.params;
  const { mainCategory, subCategory, bias } = req.body;

  try {
    const user = await userSchema.findById(userId);
    if (!user) return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });

    const profile = user.profiles.id(profileId);
    if (!profile) return res.status(404).json({ message: '프로필을 찾을 수 없습니다.' });

    if (profile.interests.length >= 5) {
      return res.status(400).json({ message: '관심사는 최대 5개까지 추가할 수 있습니다.' });
    }

    profile.interests.push({ mainCategory, subCategory, bias });
    await user.save();

    res.status(200).json({ message: '관심사가 추가되었습니다.', data: profile.interests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 관심사 수정
exports.updateInterest = async (req, res) => {
  const { userId, profileId, interestId } = req.params;
  const { mainCategory, subCategory, bias } = req.body;

  try {
    const user = await userSchema.findById(userId);
    if (!user) return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });

    const profile = user.profiles.id(profileId);
    if (!profile) return res.status(404).json({ message: '프로필을 찾을 수 없습니다.' });

    const interest = profile.interests.id(interestId);
    if (!interest) return res.status(404).json({ message: '관심사를 찾을 수 없습니다.' });

    interest.mainCategory = mainCategory || interest.mainCategory;
    interest.subCategory = subCategory || interest.subCategory;
    interest.bias = bias || interest.bias;

    await user.save();
    res.status(200).json({ message: '관심사가 수정되었습니다.', data: interest });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 관심사 목록 조회
exports.getInterests = async (req, res) => {
  const { userId, profileId } = req.params;

  try {
    const user = await userSchema.findById(userId).select('profiles');
    if (!user) return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });

    const profile = user.profiles.id(profileId);
    if (!profile) return res.status(404).json({ message: '프로필을 찾을 수 없습니다.' });

    res.status(200).json({ data: profile.interests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 북마크 게시물 조회
exports.getBookmarkedPosts = async (req, res) => {
  const { profileId } = req.params;

  try {
    const bookmarkedPosts = await Post.find({ bookmarks: profileId })
      .populate('author', 'nickname profileImage')
      .sort({ createdAt: -1 });

    const data = bookmarkedPosts.map(post => ({
      id: post._id,
      title: post.title,
      content: post.content,
    }));

    res.status(200).json({ result: true, data: data });
  } catch (error) {
    res.status(500).json({ result: false, message: error.message });
  }
};

/**
 * 특정 프로필로 작성된 게시글 목록 조회 (GET /api/posts/profile/:profileId)
 * @param {Request} req
 * @param {Response} res
 */
exports.getPostsByProfile = async (req, res) => {
  const { profileId } = req.params;

  try {
    // 프로필 ID로 게시글 필터링
    const posts = await Post.find({ author: profileId })
      .select('_id content author createdAt likes comments bookmarks') // 필요한 필드 선택
      .sort({ createdAt: -1 }); // 최신순 정렬

    // posts 내 모든 게시글에 대한 댓글 수를 집계 (한 번의 aggregate로 조회)
    const postIds = posts.map(post => post._id);
    const counts = await Comment.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id.toString()] = c.count; });

    // 응답 형식에 맞게 게시글 목록 변환
    const postList = posts.map(post => ({
      id: post._id,
      content: post.content,
      createdAt: post.createdAt,
      likesCount: post.likes.length,
      commentCount: countMap[post._id.toString()] || 0, // aggregate 결과 활용
      bookmarkCount: post.bookmarks.length,
    }));

    res.status(200).json({ success: true, data: postList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 실시간 인기 키워드 랭킹 조회
exports.getPopularKeywords = async (req, res) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  try {
    // 최근 1시간 내의 조회 로그를 집계하여 게시물별 조회수 증가량을 계산합니다.
    const popularPosts = await ViewLog.aggregate([
      { $match: { timestamp: { $gte: oneHourAgo } } },
      { $group: { _id: '$post', viewCount: { $sum: 1 } } },
      { $sort: { viewCount: -1 } },
      { $limit: 5 },
    ]);

    // 인기 게시물의 내용을 가져오고 키워드를 추출합니다.
    const postIds = popularPosts.map(p => p._id);
    const posts = await Post.find({ _id: { $in: postIds } });

    // 키워드 카운트
    const keywordCount = {};
    posts.forEach(post => {
      const keywords = post.content.split(/\s+/);
      keywords.forEach(keyword => {
        if (keywordCount[keyword]) {
          keywordCount[keyword] += 1;
        } else {
          keywordCount[keyword] = 1;
        }
      });
    });

    // 키워드 정렬
    const sortedKeywords = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .map(entry => ({ keyword: entry[0], count: entry[1] }));

    res.status(200).json({ success: true, keywords: sortedKeywords });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 누적 인기 키워드 랭킹 조회
 * @param {Request} req
 * @param {Response} res
 */
exports.getCumulativePopularKeywords = async (req, res) => {
  try {
    const posts = await Post.find({});
    const keywordCount = {};

    posts.forEach(post => {
      post.content.split(/\s+/).forEach(keyword => {
        if (!keyword) return;
        keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
      });
    });

    const sortedKeywords = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .map(([keyword, count]) => ({ keyword, count }));

    res.status(200).json({ success: true, keywords: sortedKeywords });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 검색어 순위 조회
 * @param {Request} req
 * @param {Response} res
 */
exports.getSearchRanking = async (req, res) => {
  try {
    const ranking = await SearchLog.aggregate([
      { $group: { _id: "$keyword", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.status(200).json({ success: true, data: ranking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};