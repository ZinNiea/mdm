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
const handleError = require('../utils/errerHandler');


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

function isBookmarked(userBookmarks, postId) {
  return userBookmarks.includes(postId.toString());
}

function isPostBookmarked(postBookmarks, userId) {
  return postBookmarks.includes(userId);
}

async function getPostsExcludingBlocked(profileId) {
  // profileId 검증 추가
  if (!profileId) {
    throw new Error('프로필 ID가 필요합니다.');
  }

  // profileId의 유효성 검사 (예: 유효한 ObjectId인지 확인)
  if (!mongoose.Types.ObjectId.isValid(profileId)) {
    throw new Error('유효하지 않은 프로필 ID입니다.');
  }

  const profile = await Profile.findById(profileId);
  if (!profile) throw new Error('프로필을 찾을 수 없습니다.');

  const blockedProfiles = profile.blockedProfiles || [];
  const posts = await Post.find({ author: { $nin: blockedProfiles } })
    .populate('author', 'nickname profileImage')
    .sort({ createdAt: -1 });

  return posts;
}

// 게시물 전체 조회 또는 카테고리별, 검색어별 조회
exports.getPosts = async (req, res) => {
  const { category, q, oq, profileId } = req.query; // 'oq' 추가
  let filter = {};

  // category가 문자열일 경우 숫자로 변환
  switch (category) {
    case '친구':
    case 'friends':
    case '1':
      filter.category = 1;
      break;
    case '전체':
    case 'public':
    case '3':
      filter.category = 3;
      break;
  }

  if (q) { // 'search'를 'q'로 변경
    // 대소문자 구분 없이 content 필드에서 검색어 포함 여부 확인
    filter.content = { $regex: q, $options: 'i' };
  }

  try {
    const posts = await Post.find(filter)
      .select('_id content author createdAt likes comments images bookmarks') // bookmarks 필드 포함
      .populate('author', 'nickname profileImage') // 프로필 정보 포함
      .sort({ createdAt: -1 }); // 최신순으로 정렬

    // 현재 사용자의 북마크 프로필 ID
    const userProfileId = profileId;

    // 각 게시물에 필요한 정보만 추출하여 새로운 객체 생성
    const postList = posts.map(post => ({
      id: post._id,
      content: post.content,
      authorId: post.author._id,
      authorNickname: post.author.nickname,
      authorImage: post.author.profileImage,
      createdAt: post.createdAt,
      likesCount: post.likes.length,
      commentCount: post.comments.length,
      likeStatus: post.likes.includes(profileId),
      bookmarkCount: post.bookmarks.length, // bookmarkCount 직접 계산
      bookmarkStatus: post.bookmarks.includes(userProfileId), // bookmarkStatus 직접 계산
      images: post.images, // 이미지 목록 추가
    }));

    res.status(200).json({ success: true, data: postList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 설명: getPostById 함수는 특정 게시물을 조회하는 API 엔드포인트를 처리합니다.
exports.getPostById = async (req, res) => {
  try {
    // const userId = verifyTokenAndGetUserId(req);
    const profileId = req.user.profileId; // userId 대신 profileId 사용
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
        commentCount: post.comments.length,
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
    const post = await findPostOrFail(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: '게시물을 찾을 수 없습니다.' });
    }

    await Post.findByIdAndDelete(postId);

    res.status(200).json({ success: true, message: '게시물이 성공적으로 삭제되었습니다.' });
  } catch (err) {
    handleError(res, err);
  }
};

exports.deletePost2 = async (req, res) => {
  const { postId } = req.params;
  
  try {
    const result = await Post.findByIdAndDelete(postId);
    
    if (!result) {
      return res.status(404).json({ result: false, message: '게시물을 찾을 수 없습니다.' });
    }

    res.status(200).json({ result: true, message: '게시물이 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
}

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
  const { profileId } = req.body;

  try {
    const userId = verifyTokenAndGetUserId(req);
    const post = await findPostOrFail(postId);

    if (post.likes.includes(profileId)) {
      post.likes.pull(profileId);
      await post.save();
      return res.status(200).json({ result: true, message: '좋아요를 취소했습니다.' });
    } else {
      post.likes.push(profileId);
      await post.save();
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

  //postList => { postId, content, createdAt, likeCount, commentCount, bookmarkCount }
  try {
    // 프로필 ID로 게시글 필터링
    const posts = await Post.find({ author: profileId })
      .select('_id content author createdAt likes comments bookmarks') // 필요한 필드 선택
      .sort({ createdAt: -1 }); // 최신순 정렬

    // 응답 형식에 맞게 게시글 목록 변환
    const postList = posts.map(post => ({
      id: post._id,
      content: post.content,
      createdAt: post.createdAt,
      likesCount: post.likes.length,
      commentCount: post.comments.length,
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