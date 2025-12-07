const Favorite = require('../models/Favorite');
const {
  isDatabaseReady,
  databaseUnavailableResponse,
} = require('../utils/dbStatus');

/**
 * @desc    Get all favorites for the current user
 * @route   GET /api/favorites
 * @access  Private
 */
const getFavorites = async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json(databaseUnavailableResponse());
    }

    const userId = req.userId;
    
    const favorites = await Favorite.getUserFavorites(userId);
    
    res.json({
      favorites,
      total: favorites.length
    });

  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching favorites'
    });
  }
};

/**
 * @desc    Add a recipe to favorites
 * @route   POST /api/favorites
 * @access  Private
 */
const addFavorite = async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json(databaseUnavailableResponse());
    }

    const userId = req.userId;
    const { 
      recipe_id, 
      title, 
      image, 
      ready_in_minutes, 
      protein_grams, 
      calories 
    } = req.body;

    if (!recipe_id || !title) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Recipe ID and title are required'
      });
    }

    const existing = await Favorite.findOne({ 
      user_id: userId, 
      recipe_id: recipe_id 
    });

    if (existing) {
      return res.status(409).json({
        error: 'Already favorited',
        message: 'This recipe is already in your favorites',
        favorite: existing
      });
    }

    const favorite = await Favorite.create({
      user_id: userId,
      recipe_id,
      title,
      image: image || '',
      ready_in_minutes: ready_in_minutes || 0,
      protein_grams: protein_grams || 0,
      calories: calories || 0
    });

    res.status(201).json({
      message: 'Recipe added to favorites',
      favorite
    });

  } catch (error) {
    console.error('Add favorite error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Already favorited',
        message: 'This recipe is already in your favorites'
      });
    }
    
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while adding to favorites'
    });
  }
};

/**
 * @desc    Check if a recipe is favorited
 * @route   GET /api/favorites/check/:recipeId
 * @access  Private
 */
const checkFavorite = async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json(databaseUnavailableResponse());
    }

    const userId = req.userId;
    const { recipeId } = req.params;

    if (!recipeId) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Recipe ID is required'
      });
    }

    const isFavorited = await Favorite.isFavorited(userId, parseInt(recipeId));
    
    res.json({
      recipeId: parseInt(recipeId),
      isFavorited
    });

  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while checking favorite status'
    });
  }
};

/**
 * @desc    Remove a recipe from favorites
 * @route   DELETE /api/favorites/:recipeId
 * @access  Private
 */
const removeFavorite = async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json(databaseUnavailableResponse());
    }

    const userId = req.userId;
    const { recipeId } = req.params;

    if (!recipeId) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Recipe ID is required'
      });
    }

    const deleted = await Favorite.removeFavorite(userId, parseInt(recipeId));

    if (!deleted) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Favorite not found'
      });
    }

    res.json({
      message: 'Recipe removed from favorites',
      recipeId: parseInt(recipeId)
    });

  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while removing favorite'
    });
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  checkFavorite,
  removeFavorite
};

