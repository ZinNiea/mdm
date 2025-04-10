// server/routes/api/index.js
const express = require('express');
const router = express.Router();

const usersRouter = require('./users.routes');
const postsRouter = require('./post.routes');
const auctionsRouter = require('./auctions.routes');
const chatsRouter = require('./chats.routes');
const authRouter = require('./auth.routes');
const notificationsRouter = require('./notifications.routes');

router.use('/users', usersRouter);
router.use('/posts', postsRouter);
router.use('/auctions', auctionsRouter);
router.use('/chats', chatsRouter);
router.use('/auth', authRouter);
router.use('/notifications', notificationsRouter);

module.exports = router;