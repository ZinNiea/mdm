// server/user/postController.js
require('dotenv').config();
const { Post } = require('../models/postModel');
const { User } = require('../models/userModel');
const { Report } = require('../models/reportModel');
const jwt = require('jsonwebtoken');
const Report = require('../models/reportModel');
const SECRET_KEY = process.env.SECRET_KEY;
const MODELS = require('../models/constants');

// 게시물 전체 조회 또는 카테고리별, 검색어별 조회
exports.getPosts = async (req, res) => {
  const { category, search, profileId } = req.query; // 쿼리 파라미터에서 카테고리와 검색어 추출
  let filter = {};

  if (category) {
    if (category === '친구' || Number(category) === 1) {
      filter.category = 1;
    } else if (category === '전체' || Number(category) === 3) {
      filter.category = 3;
    } else {
      filter.category = Number(category);
    }
  }

  if (search) {
    // 대소문자 구분 없이 content 필드에서 검색어 포함 여부 확인
    filter.content = { $regex: search, $options: 'i' };
  }

  if (profileId) {
    filter.author = profileId;
  }

  try {
    const posts = await Post.find(filter)
      .select('_id content author createdAt likes comments bookmarks') // 필요한 필드만 선택
      .populate('author', 'nickname userImage') // 프로필 정보 포함
      .sort({ createdAt: -1 }); // 최신순으로 정렬

    // 각 게시��에 필요한 정보만 추출하여 새로운 객체 생성
    const postList = posts.map(post => ({
      id: post._id,
      content: post.content,
      authorId: post.author._id,
      authorNickname: post.author.nickname,
      authorImage: post.author.userImage,
      createdAt: post.createdAt,
      likesCount: post.likes.length,
      commentCount: post.comments.length,
      bookmarkCount: post.bookmarks.length,
      likeStatus: post.likes.includes(profileId),
      bookmarkStatus: post.bookmarks.includes(profileId),
    }));

    res.status(200).json({ success: true, data: postList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 설명: getPostById 함수는 특정 게시물을 조회하는 API 엔드포인트를 처리합니다.
exports.getPostById = async (req, res) => {
  // 요청 헤더에서 인증 토큰을 추출합니다.
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  const { postId } = req.params;

  // 토큰이 없으면 401 상태 코드와 함께 인증 필요 메시지를 반환합니다.
  if (!token) {
    return res.status(401).json({ success: false, message: '인증 토큰이 필요합니다.' });
  }

  try {
    // 토큰을 검증하고 디코딩하여 사용자 ID를 추출합니다.
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    // postId를 사용하여 게시물을 데이터베이스에서 조회하고, author와 comments.author 필드를 populating 합니다.
    const post = await Post.findById(postId)
      .populate('author', 'nickname userImage')
      .populate('comments.author', 'nickname userImage');

    // 게시물이 존재하지 않으면 404 상태 코드와 함께 오류 메시지를 반환합니다.
    if (!post) {
      return res.status(404).json({ success: false, message: '게시물을 찾을 수 없습니다.' });
    }

    // 게시물 정보를 응답으로 반환합니다.
    res.status(200).json({
      success: true,
      data: {
        _id: post._id,
        content: post.content,
        authorId: post.author._id,
        authorNickname: post.author.nickname,
        authorImage: post.author.userImage,
        createdAt: post.createdAt,
        likesCount: post.likes.length,
        likeStatus: post.likes.includes(userId),
        commentCount: post.comments.length,
        bookmarkCount: post.bookmarks.length,
        bookmarkStatus: post.bookmarks.includes(userId),
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
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: '인증 토큰이 필요합니다.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const { content, category, profileId } = req.body;
    const images = req.files ? req.files.map(file => file.location) : [];

    // 프로필 소유자 검증
    const user = await User.findById(decoded.id);
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
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  const { postId } = req.params;
  const { content } = req.body;
  const images = req.files ? req.files.map(file => file.location) : [];

  if (!token) {
    return res.status(401).json({ success: false, message: '인증 토큰이 필요합니다.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: '게시물을 찾을 수 없습니다.' });
    }

    if (post.author.toString() !== decoded.id) {
      return res.status(403).json({ success: false, message: '게시물을 수정할 권한이 없습니다.' });
    }

    post.content = content || post.content;
    // post.images = images || post.images;
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
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  const { postId } = req.params;

  if (!token) {
    return res.status(401).json({ success: false, message: '인증 토큰이 필요합니다.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: '게시물을 찾을 수 없습니다.' });
    }

    if (post.author.toString() !== decoded.id) {
      return res.status(403).json({ success: false, message: '게시물을 삭제할 권한이 없습니다.' });
    }

    await post.remove();

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
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  const { postId } = req.params;
  const { profileId } = req.body;

  if (!token) {
    return res.status(401).json({ result: false, message: '인증 토큰이 필요합니다.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ result: false, message: '게시물을 찾을 수 없습니다.' });
    }

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