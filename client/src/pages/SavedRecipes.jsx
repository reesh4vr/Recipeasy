/**
 * SavedRecipes Page - User's favorited recipes
 * CS 409 Web Programming - UIUC Final Project
 * 
 * satisfies: Saved Recipes page requirement
 * satisfies: favorites display requirement
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { favoritesAPI } from '../services/api'
import './SavedRecipes.css'

const SavedRecipes = () => {
  const [favorites, setFavorites] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await favoritesAPI.getAll()
      setFavorites(response.favorites || [])
    } catch (err) {
      console.error('Error loading favorites:', err)
      setError('Failed to load your saved recipes. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (recipeId) => {
    setRemovingId(recipeId)
    
    try {
      await favoritesAPI.remove(recipeId)
      setFavorites(prev => prev.filter(f => f.recipe_id !== recipeId))
    } catch (err) {
      console.error('Error removing favorite:', err)
    } finally {
      setRemovingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="saved-recipes page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your saved recipes...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="saved-recipes page">
        <div className="container">
          <div className="error-state">
            <span className="emoji-large">😕</span>
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button 
              className="btn btn-primary"
              onClick={loadFavorites}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="saved-recipes page fade-in">
      <div className="container">
        <header className="page-header">
          <h1 className="page-title">
            <span className="title-icon">⭐</span>
            Saved Recipes
          </h1>
          <p className="page-subtitle">
            Your favorite recipes, all in one place
          </p>
        </header>

        {favorites.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">
              <span className="emoji-large">📚</span>
            </div>
            <h3>No saved recipes yet</h3>
            <p>
              Start exploring and save recipes you love! 
              They'll appear here for easy access later.
            </p>
            <Link to="/" className="btn btn-primary">
              Find Recipes
            </Link>
          </div>
        ) : (
          <>
            <div className="favorites-count">
              {favorites.length} saved recipe{favorites.length !== 1 ? 's' : ''}
            </div>

            <div className="favorites-grid">
              {favorites.map((favorite, index) => (
                <article 
                  key={favorite._id || favorite.recipe_id} 
                  className="favorite-card fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Link 
                    to={`/recipe/${favorite.recipe_id}`} 
                    className="favorite-card-link"
                  >
                    <div className="favorite-image">
                      {favorite.image ? (
                        <img 
                          src={favorite.image} 
                          alt={favorite.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="image-placeholder">🍽️</div>
                      )}
                    </div>
                    
                    <div className="favorite-content">
                      <h3 className="favorite-title">{favorite.title}</h3>
                      
                      <div className="favorite-meta">
                        {favorite.ready_in_minutes > 0 && (
                          <span className="meta-item">
                            ⏱️ {favorite.ready_in_minutes} min
                          </span>
                        )}
                        {favorite.protein_grams > 0 && (
                          <span className="meta-item highlight">
                            💪 {favorite.protein_grams}g protein
                          </span>
                        )}
                        {favorite.calories > 0 && (
                          <span className="meta-item">
                            🔥 {favorite.calories} cal
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  <button
                    className={`remove-button ${removingId === favorite.recipe_id ? 'removing' : ''}`}
                    onClick={() => handleRemove(favorite.recipe_id)}
                    disabled={removingId === favorite.recipe_id}
                    aria-label="Remove from favorites"
                    title="Remove from favorites"
                  >
                    {removingId === favorite.recipe_id ? (
                      <span className="loading-spinner-small"></span>
                    ) : (
                      '✕'
                    )}
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SavedRecipes

