// server/user/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.registerUser);
router.post('/login', userController.login);
router.delete('/delete', userController.deleteUser);


module.exports = router;
