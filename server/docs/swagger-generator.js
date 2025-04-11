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

    // 특정 경로에 대한 명시적 태그 지정
    const explicitTags = {
        '/': 'General',
        '/hello': 'General',
        '/api/users/register': 'Authentication',
        '/api/users/login': 'Authentication',
        '/api/users/logout': 'Authentication',
        // 필요한 다른 명시적 경로
    };

    Object.keys(swaggerDoc.paths).forEach(path => {
        // 1. 명시적 태그 체크
        if (explicitTags[path]) {
            for (const method in swaggerDoc.paths[path]) {
                swaggerDoc.paths[path][method].tags = [explicitTags[path]];
                console.log(`  명시적 태그 할당: ${path} [${method}] -> ${explicitTags[path]}`);
            }
            return;
        }

        // 2. 패턴 기반 태그 지정 (기존 로직)
        let assignedTag = null;

        // 경로 규칙 우선순위
        const rules = [
            { pattern: /comments|comment/, tag: 'Comments' },
            { pattern: /\/auth|login|logout|register|verification/, tag: 'Authentication' },
            { pattern: /\/users|\/user|\/profiles|\/profile/, tag: 'Users' },
            { pattern: /\/posts|\/post/, tag: 'Posts' },
            { pattern: /notification/, tag: 'Notifications' },
            { pattern: /\/chat|\/chats/, tag: 'Chats' },
            { pattern: /auction|\/bid/, tag: 'Auctions' }
        ];

        // 첫 번째 일치하는 규칙 적용
        for (const rule of rules) {
            if (path.match(rule.pattern)) {
                assignedTag = rule.tag;
                break;
            }
        }

        if (assignedTag) {
            // 태그 적용
            for (const method in swaggerDoc.paths[path]) {
                swaggerDoc.paths[path][method].tags = [assignedTag];
                console.log(`  태그 할당: ${path} [${method}] -> ${assignedTag}`);
            }
        } else {
            console.log(`  태그 미할당: ${path} (매칭되는 패턴 없음)`);
        }
    });

    // API 접두사 정규화 처리
    Object.keys(swaggerDoc.paths).forEach(path => {
        let normalizedPath = path;
        // /api/ 접두사 제거하여 기본 경로 얻기
        if (path.startsWith('/api/')) {
            normalizedPath = path.substring(4); // '/api/' 제거
        }

        // 정규화된 경로로 태그 찾기
        let assignedTag = findTagForPath(normalizedPath);

        if (assignedTag) {
            // 태그 적용
            for (const method in swaggerDoc.paths[path]) {
                swaggerDoc.paths[path][method].tags = [assignedTag];
                console.log(`  태그 할당: ${path} [${method}] -> ${assignedTag}`);
            }
        } else {
            console.log(`  태그 미할당: ${path} (매칭되는 패턴 없음)`);
        }
    });

    // 경로에 맞는 태그 찾기 함수
    function findTagForPath(path) {
        if (path.match(/\/users|\/user|profiles|profile/)) return 'Users';
        if (path.match(/\/posts|\/post/)) return 'Posts';
        if (path.match(/comments|comment/)) return 'Comments';
        if (path.match(/notification/)) return 'Notifications';
        if (path.match(/\/chats|\/chat/)) return 'Chats';
        if (path.match(/\/auth|login|logout|register|verification/)) return 'Authentication';
        if (path.match(/auction|bid/)) return 'Auctions';
        return null;
    }

    // 수정된 문서 저장
    fs.writeFileSync(outputFile, JSON.stringify(swaggerDoc, null, 2));
    console.log('태그가 적용된 Swagger 문서가 성공적으로 생성되었습니다!');
};

// 함수 실행
generateSwagger();