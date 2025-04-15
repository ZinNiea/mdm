// server/controllers/categoryController.js
const { Request, Response } = require('express');

const { Profile } = require('../models/profileModel');

/**
 * mainCategory에 해당하는 모든 subCategory를 조회하는 함수
 * 
 * @param {Request} req
 * @param {Response} res
 * @return {Promise<void>}
 */
const getSubCategories = async (req, res) => {
    const { mainCategory } = req.params;
    try {
      const profiles = await Profile.find({ 'interests.mainCategory': mainCategory });
      const subCategoriesSet = new Set();
      profiles.forEach(profile => {
        profile.interests.forEach(interest => {
          if (interest.mainCategory === mainCategory) {
            subCategoriesSet.add(interest.subCategory);
          }
        });
      });
      res.status(200).json({ subCategories: Array.from(subCategoriesSet) });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSubCategories,
};