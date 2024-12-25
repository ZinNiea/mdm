// server/middlewares/uploadMiddleware.js
// AWS SDK v3로 변경
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 이미지 유형 상수 정의
const IMAGE_TYPES = {
  PROFILE: 'profiles',
  POST: 'posts',
  AUCTION: 'auctions',
};

const upload = (folder) => multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    acl: 'public-read',
    key: function (req, file, cb) {
      cb(null, `${folder}/${Date.now().toString()}_${file.originalname}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  },
});

// 이미지 삭제 함수 수정
const deleteImage = async (imageUrl) => {
  const key = imageUrl.split('/').pop();
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  };
  const command = new DeleteObjectCommand(params);
  return s3.send(command);
};

module.exports = { upload, deleteImage, IMAGE_TYPES };