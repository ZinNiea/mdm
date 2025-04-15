// server/routes/api/index.js
const express = require('express');
const router = express.Router();

const usersRouter = require('../userRoutes');
const postsRouter = require('../postRoutes');
const auctionsRouter = require('../auctionRoutes');
const chatsRouter = require('../chatRoutes');
const authRouter = require('../authRoutes');
const notificationsRouter = require('../notificationRoutes');
const profilesRouter = require('../profileRoutes');
const categoriesRouter = require('../categoryRoutes');

router.use('/users', usersRouter);
router.use('/posts', postsRouter);
router.use('/auctions', auctionsRouter);
router.use('/chats', chatsRouter);
router.use('/auth', authRouter);
router.use('/notifications', notificationsRouter);
router.use('/profiles', profilesRouter);
router.use('/categories', categoriesRouter);

module.exports = router;