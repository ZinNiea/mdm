// server/app.js - 애플리케이션의 주요 로직
const express = require('express');
const { connectDB } = require('./db');
const { userRoutes } = require('./features/user');
const { postRoutes } = require('./features/post');
const app = express();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/user', userRoutes);
app.use('/post', postRoutes);

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

module.exports = app;