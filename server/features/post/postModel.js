// server/post/postModel.js
const mysql = require('mysql2/promise');
const { getConnection } = require('../../db');

const createPost = async (post) => {
  const connection = getConnection();
  const { title, content, authorId } = post;
  const [result] = await connection.query(
    'INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)',
    [title, content, authorId]
  );
  return result.insertId;
};

const getAllPosts = async () => {
  const connection = getConnection();
  const [rows] = await connection.query(
    'SELECT posts.*, users.name AS author_name, users.email AS author_email FROM posts JOIN users ON posts.author_id = users.id'
  );
  return rows;
};

module.exports = {
  createPost,
  getAllPosts
};
