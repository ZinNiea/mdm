// controllers/commentController.js
const { Comment } = require('../models/commentModel');

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
    // 최상위 댓글만 조회 (parentId가 null인 댓글)
    const comments = await Comment.find({ postId, parentId: null })
      .sort({ createdAt: -1 })
      .lean();

    // 각 댓글에 대한 대댓글 추가
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        // 삭제된 댓글인 경우 표시 변경
        if (comment.isDeleted) {
          comment.content = '삭제된 댓글입니다.';
          comment.author = '알 수 없음';
        }

        const replies = await Comment.find({ parentId: comment._id })
          .sort({ createdAt: 1 })
          .lean();

        // 대댓글도 삭제 여부 처리
        const processedReplies = replies.map((reply) => {
          if (reply.isDeleted) {
            reply.content = '삭제된 댓글입니다.';
            reply.author = '알 수 없음';
          }
          return reply;
        });

        return { ...comment, replies: processedReplies };
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

    res.status(200).json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '댓글 삭제 실패', error });
  }
};