// server/post/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('./postController');

router.post('/', postController.createPost);
router.get('/', postController.getPosts);

module.exports = router;
