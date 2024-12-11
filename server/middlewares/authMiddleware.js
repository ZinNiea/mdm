// server/middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

exports.authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: '토큰이 필요합니다.' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
    }
    req.user = user; // 사용자 정보를 요청 객체에 추가
    // 추가: 사용자 프로필 ID 설정 (필요시)
    req.user.profileId = user.profileId; // 토큰에 profileId가 포함되어 있어야 함
    next();
  });
};