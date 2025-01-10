const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My Express API',
      version: '1.0.0',
      description: 'API documentation using Swagger',
    },
    servers: [
      {
        url: process.env.SERVER_URL || 'http://localhost:3000',
      },
    ],
    components: {
      schemas: {
        AuctionItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            title: {
              type: 'string',
            },
            content: {
              type: 'string',
            },
            category: {
              type: 'string',
              enum: ['거래', '나눔', '이벤트'],
            },
            startingbid: {
              type: 'number',
            },
            buyNowPrice: {
              type: 'number',
            },
            duration: {
              type: 'number',
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
                format: 'binary',
              },
            },
          },
          required: ['id', 'title', 'content', 'category', 'startingbid', 'buyNowPrice', 'duration'],
        },
        // User 스키마
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            username: {
              type: 'string',
            },
            // 기타 사용자 속성...
          },
          required: ['id', 'username'],
        },
        // Profile 스키마
        Profile: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            userId: {
              type: 'string',
            },
            // 기타 프로필 속성...
          },
          required: ['id', 'userId'],
        },
        // Post 스키마
        Post: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            title: {
              type: 'string',
            },
            content: {
              type: 'string',
            },
            author: {
              $ref: '#/components/schemas/User',
            },
            // 기타 게시물 속성...
          },
          required: ['id', 'title', 'content', 'author'],
        },
        // Comment 스키마
        Comment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            postId: {
              type: 'string',
            },
            content: {
              type: 'string',
            },
            author: {
              $ref: '#/components/schemas/User',
            },
            // 기타 댓글 속성...
          },
          required: ['id', 'postId', 'content', 'author'],
        },
        // Notification 스키마
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            userId: {
              type: 'string',
            },
            type: {
              type: 'string',
            },
            message: {
              type: 'string',
            },
            // 기타 알림 속성...
          },
          required: ['id', 'userId', 'type', 'message'],
        },
      },
    },
  },
  //apis: ['./routes/*.js', './docs/swagger.yaml'],
  apis: ['../routes/*.js', './server/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
