const swaggerAutogen = require('swagger-autogen')();
const swaggerOptionsModule = require('./swaggerOptions');

// swaggerOptions.js 파일에서 내보낸 것은 swaggerSpec 객체이므로
// 스키마 정의를 직접 작성하거나 빈 객체로 설정
const doc = {
    info: {
        title: 'MDM API',
        description: '모든 API 엔드포인트에 대한 자동 생성 문서',
        version: '1.0.0'
    },
    host: process.env.SERVER_URL?.replace(/^https?:\/\//, '') || 'localhost:3000',
    basePath: '/',
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
            // 직접 스키마 정의
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    username: { type: 'string' },
                    email: { type: 'string' }
                }
            },
            Profile: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    userId: { type: 'string' },
                    nickname: { type: 'string' }
                }
            },
            Post: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    content: { type: 'string' },
                    author: { type: 'string' }
                }
            }
            // 필요한 다른 스키마들...
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
        },
        {
            name: 'Auctions',
            description: '경매 관련 API'
        },
        {
            name: 'Chats',
            description: '채팅 관련 API'
        },
        {
            name: 'Notifications',
            description: '알림 관련 API'
        },
        {
            name: 'Comments',
            description: '댓글 관련 API'
        }
    ],
    // 자동 태그 지정 설정 추가
    autoTags: true
};

// 출력 파일 경로
const outputFile = '../docs/swagger-output.json';

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
];

// 파일 경로 기반 태그 매핑 설정
const options = {
    autoHeaders: true,
    autoQuery: true,
    autoBody: true,
    autoTags: true,
    // 중요: 파일 경로에 따라 태그 자동 할당
    routesPaths: {
        'userRoutes.js': 'Users',
        'postRoutes.js': 'Posts',
        'commentRoutes.js': 'Comments',
        'notificationRoutes.js': 'Notifications',
        'chatRoutes.js': 'Chats',
        'authRoutes.js': 'Authentication',
        'auctionRoutes.js': 'Auctions'
    },
};

swaggerAutogen(outputFile, endpointsFiles, doc, options).then(() => {
    console.log('Swagger 문서가 성공적으로 생성되었습니다');
});