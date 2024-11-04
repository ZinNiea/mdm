// routes/comments.js
const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');

// 댓글 추가
router.post('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { author, content } = req.body;

    const comment = new Comment({ postId, author, content });
    await comment.save();

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: '댓글 추가 실패', error });
  }
});

module.exports = router;

