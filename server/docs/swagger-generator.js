const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'MDM API',
        description: '모든 API 엔드포인트에 대한 자동 생성 문서',
        version: '1.0.0'
    },
    host: process.env.SERVER_URL?.replace(/^https?:\/\//, '') || 'localhost:3000',
    basePath: '/api',
    schemes: ['http', 'https'],
    securityDefinitions: {
        bearerAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
            description: '로그인 후 발급된 Bearer 토큰을 입력하세요. 예: Bearer {token}'
        }
    },
    components: {
        schemas: {
            // 기존 스키마 정의 가져오기
            ...require('./swaggerOptions').definition.components.schemas
        }
    },
    tags: [
        {
            name: 'Posts',
            description: '게시물 관련 API'
        },
        {
            name: 'Users',
            description: '사용자 관련 API'
        },
        {
            name: 'Authentication',
            description: '인증 관련 API'
        }
    ]
};

// 출력 파일 경로
const outputFile = './swagger-output.json';

// 스캔할 라우트 파일들
const endpointsFiles = [
    '../app.js',
    '../routes/userRoutes.js',
    '../routes/postRoutes.js',
    '../routes/commentRoutes.js',
    '../routes/notificationRoutes.js',
    '../routes/chatRoutes.js',
    '../routes/authRoutes.js',
    '../routes/auctionRoutes.js',
    // 필요한 다른 라우트 파일들 추가
];

swaggerAutogen(outputFile, endpointsFiles, doc);