// controllers/commentController.js
const { Comment } = require('../models/commentModel');
const { CommentReport } = require('../models/reportModel');
const { MODELS } = require('../models/constants');

// 댓글 추가 (대댓글 포함)
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, profileId, parentId } = req.body;

    // 대댓글인 경우 parentId 유효성 검사
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return res.status(400).json({ result: false, message: '원본 댓글을 찾을 수 없습니다.' });
      }
    }

    const comment = new Comment({
      postId: postId,
      author: profileId,
      content: content,
      parentId: parentId || null,
    });
    await comment.save();

    res.status(201).json({ result: true, comment });
  } catch (error) {
    res.status(500).json({ result: false, message: '댓글 추가 실패', error });
  }
};

// 댓글 목록 조회 (대댓글 포함)
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { profileId } = req.body;

    // 최상위 댓글만 조회 (parentId가 null인 댓글)
    const comments = await Comment.find({ postId, parentId: null })
      .sort({ createdAt: -1 })
      .populate('author', 'nickname profileImage')
      .lean();

    // 재귀적으로 댓글과 하위 댓글을 조회하는 함수
    const getReplies = async (comment) => {
      // 삭제된 댓글 처리
      if (comment.isDeleted) {
        comment.content = '삭제된 댓글입니다.';
        comment.author = {
          _id: null,
          nickname: '알 수 없음',
          profileImage: null,
        }
      }

      // 하위 댓글 조회
      const replies = await Comment.find({ parentId: comment._id })
        .sort({ createdAt: 1 })
        .populate('author', 'nickname profileImage')
        .lean();

      // 각 하위 댓글에 대해 재귀적으로 하위 댓글 조회
      const processedReplies = await Promise.all(
        replies.map(async (reply) => {
          if (reply.isDeleted) {
            reply.content = '삭제된 댓글입니다.';
            reply.author = {
              _id: null,
              nickname: '알 수 없음',
              profileImage: null,
            };
          }
          // 좋아요 정보 추가
          reply.likesCount = reply.likes.length;
          reply.likeStatus = profileId ? reply.likes.includes(profileId) : false;

          // 재귀적으로 하위 댓글 조회
          const nestedReplies = await getReplies(reply);
          return { ...reply, replies: nestedReplies };
        })
      );

      return processedReplies;
    };

    // 최상위 댓글에 대해 하위 댓글을 포함시키는 작업
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        // 좋아요 정보 추가
        comment.likesCount = comment.likes.length;
        comment.likeStatus = profileId ? comment.likes.includes(profileId) : false;

        const replies = await getReplies(comment);
        return { ...comment, replies };
      })
    );

    res.status(200).json(commentsWithReplies);
  } catch (error) {
    res.status(500).json({ message: '댓글 조회 실패', error });
  }
};

// 댓글 삭제
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
    }

    // 댓글 삭제 여부 업데이트
    comment.isDeleted = true;
    await comment.save();

    res.status(200).json({ result: true, message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ result: true, message: '댓글 삭제 실패', error });
  }
};

// 댓글 좋아요/좋아요 취소
exports.toggleCommentLike = async (req, res) => {
  const { commentId } = req.params;
  const { profileId } = req.body;

  if (!profileId) {
    return res.status(400).json({ result: false, message: '프로필 ID가 필요합니다.' });
  }

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ result: false, message: '댓글을 찾을 수 없습니다.' });
    }

    if (comment.likes.includes(profileId)) {
      comment.likes.pull(profileId);
      await comment.save();
      return res.status(200).json({ result: true, message: '좋아요가 취소되었습니다.' });
    } else {
      comment.likes.push(profileId);
      await comment.save();
      return res.status(200).json({ result: true, message: '댓글에 좋아요가 추가되었습니다.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ result: false, message: '좋아요 처리에 실패했습니다.', error });
  }
};

// 댓글 신고
exports.reportComment = async (req, res) => {
  const { commentId } = req.params;
  const { category, content, profileId } = req.body;

  if (!profileId) {
    return res.status(400).json({ result: false, message: '프로필 ID가 필요합니다.' });
  }

  if (!category || !content) {
    return res.status(400).json({ result: false, message: '카테고리와 내용이 필요합니다.' });
  }

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ result: false, message: '댓글을 찾을 수 없습니다.' });
    }

    // 중복 신고 방지 (같은 사용자가 같은 댓글을 여러 번 신고하지 않도록)
    const existingReport = await CommentReport.findOne({ comment: commentId, reporter: profileId });
    if (existingReport) {
      return res.status(400).json({ result: false, message: '이미 이 댓글을 신고하였습니다.' });
    }

    const report = new CommentReport({
      comment: commentId,
      reporter: profileId,
      category: category,
      content: content,
    });

    await report.save();

    res.status(201).json({ result: true, message: '댓글이 성공적으로 신고되었습니다.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ result: false, message: '댓글 신고에 실패했습니다.', error });
  }
};