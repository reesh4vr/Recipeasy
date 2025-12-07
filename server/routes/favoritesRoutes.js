const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');
const { authMiddleware } = require('../middleware/authMiddleware');


router.use(authMiddleware);

/**
 * @route   GET /api/favorites
 * @desc    Get all favorites for the current user
 * @access  Private (requires JWT)
 */
router.get('/', favoritesController.getFavorites);

/**
 * @route   POST /api/favorites
 * @desc    Add a recipe to favorites
 * @access  Private (requires JWT)
 * @body    { recipe_id, title, image, ready_in_minutes?, protein_grams?, calories? }
 */
router.post('/', favoritesController.addFavorite);

/**
 * @route   GET /api/favorites/check/:recipeId
 * @desc    Check if a recipe is favorited
 * @access  Private (requires JWT)
 */
router.get('/check/:recipeId', favoritesController.checkFavorite);

/**
 * @route   DELETE /api/favorites/:recipeId
 * @desc    Remove a recipe from favorites
 * @access  Private (requires JWT)
 * @param   recipeId - Spoonacular recipe ID
 */
router.delete('/:recipeId', favoritesController.removeFavorite);

module.exports = router;

