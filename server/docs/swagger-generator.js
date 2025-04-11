const swaggerAutogen = require("swagger-autogen")();
const path = require("path");

const doc = {
  info: {
    title: "MDM API",
    description: "모든 API 엔드포인트에 대한 자동 생성 문서",
    version: "1.0.0",
  },
  host: process.env.SERVER_URL?.replace(/^https?:\/\//, "") || "localhost:3000",
  basePath: "/",
  schemes: ["http", "https"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      in: "header",
      name: "Authorization",
      description:
        "로그인 후 발급된 Bearer 토큰을 입력하세요. 예: Bearer {token}",
    },
  },
  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          username: { type: "string" },
          email: { type: "string" },
        },
      },
      Profile: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          nickname: { type: "string" },
        },
      },
      Post: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          content: { type: "string" },
          author: { type: "string" },
        },
      },
    },
  },
  tags: [
    {
      name: "Posts",
      description: "게시물 관련 API",
    },
    {
      name: "Users",
      description: "사용자 관련 API",
    },
    {
      name: "Authentication",
      description: "인증 관련 API",
    },
    {
      name: "Auctions",
      description: "경매 관련 API",
    },
    {
      name: "Chats",
      description: "채팅 관련 API",
    },
    {
      name: "Notifications",
      description: "알림 관련 API",
    },
    {
      name: "Comments",
      description: "댓글 관련 API",
    },
  ],
};

// 출력 파일 경로 수정
const outputFile = path.join(__dirname, "swagger-output.json");

// 스캔할 라우트 파일들 - 잘못된 URL 수정
const endpointsFiles = [
  path.join(__dirname, "../app.js"),
  path.join(__dirname, "../routes/api/index.js"), // 올바른 라우트 파일 경로
  path.join(__dirname, "../routes/userRoutes.js"),
  path.join(__dirname, "../routes/postRoutes.js"),
  path.join(__dirname, "../routes/commentRoutes.js"),
  path.join(__dirname, "../routes/notificationRoutes.js"),
  path.join(__dirname, "../routes/chatRoutes.js"),
  path.join(__dirname, "../routes/authRoutes.js"),
  path.join(__dirname, "../routes/auctionRoutes.js"),
];

// 더 정확한 경로 매칭을 위한 수정
const generateSwagger = async () => {
  // 기본 문서 생성
  await swaggerAutogen(outputFile, endpointsFiles, doc);

  console.log("기본 Swagger 문서 생성 완료, 태그 후처리 시작...");

  // 생성된 문서 로드
  const fs = require("fs");
  const swaggerDoc = JSON.parse(fs.readFileSync(outputFile));

  console.log(`총 ${Object.keys(swaggerDoc.paths).length}개의 API 경로 발견`);

  // 명시적 태그 지정 (기본 설정)
  const explicitTags = {
    "/": "General",
    "/hello": "General",
    "/api/users/register": "Authentication",
    "/api/users/login": "Authentication",
    "/api/users/logout": "Authentication",
  };

  // 경로 분류 함수
  function classifyPath(path) {
    // 명시적으로 지정된 태그가 있으면 사용
    if (explicitTags[path]) {
      return explicitTags[path];
    }

    // /api/ 경로만 태그 할당하고 나머지는 default로 유지
    if (path.startsWith("/api/")) {
      const normalizedPath = path.substring(4); // '/api/' 제거

      // API 경로에 대한 태그 할당
      if (normalizedPath.match(/users|user|profiles|profile/)) return "Users";
      if (normalizedPath.match(/posts|post/)) return "Posts";
      if (normalizedPath.match(/comments|comment/)) return "Comments";
      if (normalizedPath.match(/notifications|notification/)) return "Notifications";
      if (normalizedPath.match(/chats|chat/)) return "Chats";
      if (normalizedPath.match(/auth|login|logout|register|verification/)) return "Authentication";
      if (normalizedPath.match(/auctions|auction|bid/)) return "Auctions";
    }

    // /api/ 접두사가 없는 경로는 모두 default로 유지
    return "default";
  }

  // 모든 경로에 태그 적용
  Object.keys(swaggerDoc.paths).forEach((path) => {
    const tag = classifyPath(path);

    // default가 아닌 경우에만 태그 적용
    if (tag !== "default") {
      for (const method in swaggerDoc.paths[path]) {
        swaggerDoc.paths[path][method].tags = [tag];
        console.log(`  태그 할당: ${path} [${method}] -> ${tag}`);
      }
    } else {
      // default 태그는 출력만 하고 실제 태그는 변경하지 않음
      console.log(`  기본 태그 유지: ${path} (default 그룹)`);
    }
  });

  // 수정된 문서 저장
  fs.writeFileSync(outputFile, JSON.stringify(swaggerDoc, null, 2));
  console.log("태그가 적용된 Swagger 문서가 성공적으로 생성되었습니다!");
};

// 함수 실행
generateSwagger();
