// server/controllers/postController.test.js

const request = require('supertest');
const app = require('../app');
const { Post } = require('../models/postModel');
const { MODELS } = require('../models/constants');
const jwt = require('jsonwebtoken');
const SECRET_KEY = '64nv7tUpIeA6Z8L71Ld2cq2kFRwAZuPB';

jest.mock('../models/postModel');

app.get('/posts', require('./postController').getPosts);
app.get('/posts/:postId', require('./postController').getPostById);

describe('Post Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getPosts', () => {
        it('should retrieve a list of posts successfully', async () => {
            const mockPosts = [
                {
                    _id: 'post1',
                    content: 'This is a test post',
                    author: {
                        _id: 'author1',
                        nickname: 'Tester',
                        profileImage: 'image1.png',
                    },
                    createdAt: new Date(),
                    likes: ['user1', 'user2'],
                    comments: [{}, {}],
                    bookmarks: ['user3'],
                },
                {
                    _id: 'post2',
                    content: 'Another test post',
                    author: {
                        _id: 'author2',
                        nickname: 'Tester2',
                        profileImage: 'image2.png',
                    },
                    createdAt: new Date(),
                    likes: [],
                    comments: [],
                    bookmarks: [],
                },
            ];

            // Post.find 메서드 모킹
            Post.find.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue(mockPosts),
            });
            

            const response = await request(app)
                .get('/posts')
                .query({ category: '전체', search: 'test', profileId: 'user1' });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: mockPosts.map(post => ({
                    id: post._id,
                    content: post.content,
                    authorId: post.author._id,
                    authorNickname: post.author.nickname,
                    authorImage: post.author.profileImage,
                    createdAt: post.createdAt.toISOString(),
                    likesCount: post.likes.length,
                    commentCount: post.comments.length,
                    bookmarkCount: post.bookmarks.length,
                    likeStatus: post.likes.includes('user1'),
                    bookmarkStatus: post.bookmarks.includes('user1'),
                })),
            });

            expect(Post.find).toHaveBeenCalledWith({
                category: 3,
                content: { $regex: 'test', $options: 'i' },
                author: 'user1',
            });
            expect(Post.find().select).toHaveBeenCalledWith('_id content author createdAt likes comments bookmarks');
            expect(Post.find().populate).toHaveBeenCalledWith('author', 'nickname profileImage');
            expect(Post.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
        });

        it('특정 author를 가진 게시글을 올바르게 조회해야 한다', async () => {
            const mockPosts = [
                { _id: '1', content: 'Post 1', author: 'Author1', createdAt: new Date(), likes: 10, comments: [], bookmarks: [] },
                { _id: '2', content: 'Post 2', author: 'Author1', createdAt: new Date(), likes: 20, comments: [], bookmarks: [] },
            ];

            // 1. filter 정의
            const filter = { author: 'Author1' };
    
            // 2. Mock 설정
            const selectMock = jest.fn().mockReturnThis();
            const populateMock = jest.fn().mockReturnThis();
            const sortMock = jest.fn().mockResolvedValue(mockPosts);
    
            Post.find.mockReturnValue({
                select: selectMock,
                populate: populateMock,
                sort: sortMock,
            });
    
            // 3. 실제 호출
            const result = await Post.find(filter)
                  .select('_id content author createdAt likes comments bookmarks')
                  .populate('author', 'nickname profileImage')
                  .sort({ createdAt: -1 });
    
            // 4. 검증
            expect(Post.find).toHaveBeenCalledWith(filter);
            expect(selectMock).toHaveBeenCalledWith('_id content author createdAt likes comments bookmarks');
            expect(populateMock).toHaveBeenCalledWith('author', 'nickname profileImage');
            expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
            expect(result).toEqual(mockPosts);
        });
    });

    // 추가적인 테스트 케이스를 여기에 작성할 수 있습니다.
});