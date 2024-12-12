// server/middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

// 토큰 블랙리스트 추가
const tokenBlacklist = [];

// 블랙리스트에 토큰 추가하는 함수
exports.addTokenToBlacklist = (token) => {
  tokenBlacklist.push(token);
};

exports.authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: '토큰이 필요합니다.' });
  }

  // 블랙리스트에 있는지 확인
  if (tokenBlacklist.includes(token)) {
    return res.status(401).json({ message: '이 토큰은 로그아웃 되었습니다.' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
    }
    req.user = user; // 사용자 정보를 요청 객체에 추가
    req.user.profileId = user.profileId; // 토큰에 profileId가 포함되어 있어야 함
    next();
  });
};