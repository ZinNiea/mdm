const swaggerAutogen = require('swagger-autogen')();
const path = require('path');

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
};

// 출력 파일 경로 수정
const outputFile = path.join(__dirname, 'swagger-output.json');

// 스캔할 라우트 파일들 - 잘못된 URL 수정
const endpointsFiles = [
    path.join(__dirname, '../app.js'),
    path.join(__dirname, '../routes/api/index.js'), // 올바른 라우트 파일 경로
    path.join(__dirname, '../routes/userRoutes.js'),
    path.join(__dirname, '../routes/postRoutes.js'),
    path.join(__dirname, '../routes/commentRoutes.js'),
    path.join(__dirname, '../routes/notificationRoutes.js'),
    path.join(__dirname, '../routes/chatRoutes.js'),
    path.join(__dirname, '../routes/authRoutes.js'),
    path.join(__dirname, '../routes/auctionRoutes.js'),
];

// 후처리 함수 정의 - 생성된 문서를 수정하는 접근법
const generateSwagger = async () => {
    // 기본 문서 생성
    await swaggerAutogen(outputFile, endpointsFiles, doc);

    // 생성된 문서 로드
    const fs = require('fs');
    const swaggerDoc = JSON.parse(fs.readFileSync(outputFile));

    // 경로 기반 태그 매핑
    const pathToTagMapping = {
        '/user': 'Users',
        '/users': 'Users',
        '/post': 'Posts',
        '/posts': 'Posts',
        '/comment': 'Comments',
        '/comments': 'Comments',
        '/notification': 'Notifications',
        '/notifications': 'Notifications',
        '/chat': 'Chats',
        '/chats': 'Chats',
        '/auth': 'Authentication',
        '/auction': 'Auctions',
        '/auctions': 'Auctions',
    };

    // 모든 API 경로 순회하며 태그 할당
    Object.keys(swaggerDoc.paths).forEach(path => {
        // 경로에 맞는 태그 찾기
        let matchedTag = null;
        for (const prefix in pathToTagMapping) {
            if (path.includes(prefix)) {
                matchedTag = pathToTagMapping[prefix];
                break;
            }
        }

        if (matchedTag) {
            // 모든 HTTP 메서드에 태그 적용
            for (const method in swaggerDoc.paths[path]) {
                if (!swaggerDoc.paths[path][method].tags) {
                    swaggerDoc.paths[path][method].tags = [];
                }
                // 기존 태그 제거하고 새 태그만 설정
                swaggerDoc.paths[path][method].tags = [matchedTag];
            }
        }
    });

    // 수정된 문서 저장
    fs.writeFileSync(outputFile, JSON.stringify(swaggerDoc, null, 2));
    console.log('태그가 적용된 Swagger 문서가 성공적으로 생성되었습니다!');
};

// 함수 실행
generateSwagger();