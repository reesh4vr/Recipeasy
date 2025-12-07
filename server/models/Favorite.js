
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  recipe_id: {
    type: Number,
    required: [true, 'Recipe ID is required']
  },
  title: {
    type: String,
    required: [true, 'Recipe title is required'],
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  ready_in_minutes: {
    type: Number,
    default: 0
  },
  protein_grams: {
    type: Number,
    default: 0
  },
  calories: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});


favoriteSchema.index({ user_id: 1, recipe_id: 1 }, { unique: true });

favoriteSchema.index({ user_id: 1, created_at: -1 });

/**
 * Static method to check if a recipe is favorited by a user
 * @param {ObjectId} userId - User's MongoDB ID
 * @param {number} recipeId - Spoonacular recipe ID
 * @returns {Promise<boolean>}
 */
favoriteSchema.statics.isFavorited = async function(userId, recipeId) {
  const favorite = await this.findOne({ user_id: userId, recipe_id: recipeId });
  return !!favorite;
};

/**
 * Static method to get all favorites for a user
 * @param {ObjectId} userId - User's MongoDB ID
 * @returns {Promise<Array>}
 */
favoriteSchema.statics.getUserFavorites = function(userId) {
  return this.find({ user_id: userId })
    .sort({ created_at: -1 })
    .lean();
};

/**
 * Static method to add a favorite
 * @param {ObjectId} userId - User's MongoDB ID
 * @param {Object} recipeData - Recipe data to save
 * @returns {Promise<Object>}
 */
favoriteSchema.statics.addFavorite = async function(userId, recipeData) {
  const existing = await this.findOne({ 
    user_id: userId, 
    recipe_id: recipeData.recipe_id 
  });
  
  if (existing) {
    return existing;
  }
  
  return this.create({
    user_id: userId,
    ...recipeData
  });
};

/**
 * Static method to remove a favorite
 * @param {ObjectId} userId - User's MongoDB ID
 * @param {number} recipeId - Spoonacular recipe ID
 * @returns {Promise<Object>}
 */
favoriteSchema.statics.removeFavorite = function(userId, recipeId) {
  return this.findOneAndDelete({ 
    user_id: userId, 
    recipe_id: recipeId 
  });
};

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;

