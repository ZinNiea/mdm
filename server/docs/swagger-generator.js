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

// 더 정확한 경로 매칭을 위한 수정
const generateSwagger = async () => {
    // 기본 문서 생성
    await swaggerAutogen(outputFile, endpointsFiles, doc);
    
    console.log('기본 Swagger 문서 생성 완료, 태그 후처리 시작...');
    
    // 생성된 문서 로드
    const fs = require('fs');
    const swaggerDoc = JSON.parse(fs.readFileSync(outputFile));
    
    console.log(`총 ${Object.keys(swaggerDoc.paths).length}개의 API 경로 발견`);
    
    // 태그 매핑 적용 전 모든 경로 출력 (디버깅용)
    console.log('발견된 API 경로:');
    Object.keys(swaggerDoc.paths).forEach(path => {
        console.log(`  - ${path}`);
    });
    
    // 경로별 태그 매핑 (더 명확한 규칙)
    Object.keys(swaggerDoc.paths).forEach(path => {
        let assignedTag = null;
        
        // 절대적인 경로 시작 부분 확인
        if (path.startsWith('/user') || path.startsWith('/users')) {
            assignedTag = 'Users';
        } else if (path.startsWith('/post') || path.startsWith('/posts')) {
            assignedTag = 'Posts';
        } else if (path.startsWith('/comment') || path.includes('comments')) {
            assignedTag = 'Comments';
        } else if (path.includes('notification')) {
            assignedTag = 'Notifications';
        } else if (path.startsWith('/chat') || path.includes('/chats')) {
            assignedTag = 'Chats';
        } else if (path.startsWith('/auth')) {
            assignedTag = 'Authentication';
        } else if (path.startsWith('/auction') || path.includes('auctions')) {
            assignedTag = 'Auctions';
        }
        
        if (assignedTag) {
            // 해당 경로의 모든 HTTP 메서드에 태그 적용
            for (const method in swaggerDoc.paths[path]) {
                swaggerDoc.paths[path][method].tags = [assignedTag];
                console.log(`  태그 할당: ${path} [${method}] -> ${assignedTag}`);
            }
        } else {
            console.log(`  태그 미할당: ${path} (매칭되는 패턴 없음)`);
        }
    });
    
    // 수정된 문서 저장
    fs.writeFileSync(outputFile, JSON.stringify(swaggerDoc, null, 2));
    console.log('태그가 적용된 Swagger 문서가 성공적으로 생성되었습니다!');
};

// 함수 실행
generateSwagger();