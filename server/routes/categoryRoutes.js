// server/routes/api/categoryRoutes.js
// #swagger.tags = ['Category']
const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');

// mainCategory에 해당하는 모든 subCategory를 조회하는 API
// #swagger.description = '특정 mainCategory에 해당하는 모든 subCategory를 조회합니다'
// #swagger.responses[200] = { description: 'subCategory 목록 반환' }
// #swagger.responses[500] = { description: '서버 오류' }
// #swagger.parameters['mainCategory'] = { description: '조회할 mainCategory', in: 'path', required: true, type: 'string' }
router.get('/:mainCategory/subcategories', categoryController.getSubCategories);

module.exports = router;