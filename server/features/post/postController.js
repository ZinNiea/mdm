// server/post/postController.js
const { createPost, getAllPosts } = require('./postModel');

exports.createPost = async (req, res) => {
  const { title, content, authorId } = req.body;
  try {
    const postId = await createPost({ title, content, authorId });
    res.status(201).json({ id: postId, title, content });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const posts = await getAllPosts();
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
