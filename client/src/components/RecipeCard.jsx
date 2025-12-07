/**
 * RecipeCard Component - Display recipe in grid
 * CS 409 Web Programming - UIUC Final Project
 * 
 * satisfies: recipe card display requirement
 * satisfies: UX/UI design requirement
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { favoritesAPI } from '../services/api'
import './RecipeCard.css'

const RecipeCard = ({ recipe, onFavoriteChange, isFavorited: initialFavorited = false }) => {
  const { isAuthenticated } = useAuth()
  const [isFavorited, setIsFavorited] = useState(initialFavorited)
  const [isLoading, setIsLoading] = useState(false)

  const {
    id,
    title,
    image,
    readyInMinutes,
    proteinGrams,
    calories,
    matchPercentage,
    usedIngredientCount,
    missedIngredientCount
  } = recipe

  const handleFavoriteClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      // Could show a tooltip or redirect to login
      return
    }

    setIsLoading(true)
    try {
      if (isFavorited) {
        await favoritesAPI.remove(id)
        setIsFavorited(false)
      } else {
        await favoritesAPI.add(recipe)
        setIsFavorited(true)
      }
      onFavoriteChange?.()
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Determine match badge color
  const getMatchColor = () => {
    if (matchPercentage >= 80) return 'excellent'
    if (matchPercentage >= 50) return 'good'
    return 'fair'
  }

  return (
    <article className="recipe-card fade-in">
      <Link to={`/recipe/${id}`} className="recipe-card-link">
        {/* Image */}
        <div className="recipe-card-image">
          {image ? (
            <img 
              src={image} 
              alt={`${title} dish`}
              loading="lazy"
            />
          ) : (
            <div className="recipe-card-placeholder">
              <span>🍽️</span>
            </div>
          )}
          
          {/* Match percentage badge */}
          {typeof matchPercentage === 'number' && (
            <div className={`match-badge ${getMatchColor()}`}>
              {matchPercentage}% match
            </div>
          )}

          {/* Favorite button */}
          {isAuthenticated && (
            <button
              className={`favorite-btn ${isFavorited ? 'favorited' : ''} ${isLoading ? 'loading' : ''}`}
              onClick={handleFavoriteClick}
              disabled={isLoading}
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorited ? '❤️' : '🤍'}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="recipe-card-content">
          <h3 className="recipe-card-title">{title}</h3>

          {/* Stats */}
          <div className="recipe-card-stats">
            <div className="stat-item" title="Cooking time">
              <span className="stat-icon">⏱️</span>
              <span className="stat-value">{readyInMinutes || '?'} min</span>
            </div>
            
            <div className="stat-item" title="Protein content">
              <span className="stat-icon">💪</span>
              <span className="stat-value">{proteinGrams || 0}g protein</span>
            </div>
            
            {calories > 0 && (
              <div className="stat-item" title="Calories per serving">
                <span className="stat-icon">🔥</span>
                <span className="stat-value">{calories} cal</span>
              </div>
            )}
          </div>

          {/* Ingredient match info */}
          {(usedIngredientCount || missedIngredientCount) && (
            <div className="recipe-card-ingredients">
              <span className="ingredients-have">
                ✓ Have {usedIngredientCount}
              </span>
              <span className="ingredients-need">
                + Need {missedIngredientCount}
              </span>
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}

export default RecipeCard

