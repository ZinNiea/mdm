const express = require('express');
const userController = require('./userController');

const router = express.Router();

// Import controllers

// Define routes
router.use('/users', userController);

module.exports = router;