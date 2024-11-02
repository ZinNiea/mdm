// server/user/postController.js
const jwt = require('jsonwebtoken');
const Post = require('../models/postModel');
const SECRET_KEY = 'your_secret_key'; // 환경 변수로 관리하는 것을 권장합니다.

const CATEGORY = Post.CATEGORY;

// 게시물 전체 조회 또는 카테고리별, 검색어별 조회
exports.getPosts = async (req, res) => {
  const { category, search } = req.query; // 쿼리 파라미터에서 카테고리와 검색어 추출
  let filter = {};

  if (category) {
    filter.category = Number(category);
  }

  if (search) {
    // 대소문자 구분 없이 content 필드에서 검색어 포함 여부 확인
    filter.content = { $regex: search, $options: 'i' };
  }

  try {
    const posts = await Post.find(filter)
      .populate('author', 'userName email') // 작성자 정보 포함
      .populate('comments.author', 'userName email') // 댓글 작성자 정보 포함
      .sort({ created_at: -1 }); // 최신순으로 정렬
    res.status(200).json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



// 특정 게시물 조회
exports.getPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id)
      .populate('author', 'userName email')
      .populate('comments.author', 'userName email');
    if (!post) {
      return res.status(404).json({ success: false, message: '게시물을 찾을 수 없습니다.' });
    }
    res.status(200).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
    const { content, images, category } = req.body;

    // 카테고리 유효성 검사
    if (!Object.values(Post.CATEGORY).includes(category)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 카테고리입니다.' });
    }

    const newPost = await Post.create({
      author: decoded.id,
      content,
      images,
      category,
      created_at: new Date(),
      updated_at: new Date(),
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
  const { id } = req.params;
  const { content, images } = req.body;

  if (!token) {
    return res.status(401).json({ success: false, message: '인증 토큰이 필요합니다.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ success: false, message: '게시물을 찾을 수 없습니다.' });
    }

    if (post.author.toString() !== decoded.id) {
      return res.status(403).json({ success: false, message: '게시물을 수정할 권한이 없습니다.' });
    }

    post.content = content || post.content;
    post.images = images || post.images;
    post.updated_at = new Date();

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
  const { id } = req.params;

  if (!token) {
    return res.status(401).json({ success: false, message: '인증 토큰이 필요합니다.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const post = await Post.findById(id);

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