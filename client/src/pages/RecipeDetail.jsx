/**
 * RecipeDetail Page - Full recipe information
 * CS 409 Web Programming - UIUC Final Project
 * 
 * satisfies: Recipe Detail view requirement
 * satisfies: nutrition display requirement
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { recipesAPI, favoritesAPI } from '../services/api'
import './RecipeDetail.css'

const RecipeDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  
  const [recipe, setRecipe] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    loadRecipe()
    if (isAuthenticated) {
      checkFavorite()
    }
  }, [id, isAuthenticated])

  const loadRecipe = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await recipesAPI.getDetail(id)
      setRecipe(data)
    } catch (err) {
      console.error('Error loading recipe:', err)
      setError(
        err.response?.status === 404 
          ? 'Recipe not found' 
          : 'Failed to load recipe details'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const checkFavorite = async () => {
    try {
      const response = await favoritesAPI.check(id)
      setIsFavorited(response.isFavorited)
    } catch (err) {
      console.error('Error checking favorite:', err)
    }
  }

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    setFavoriteLoading(true)
    try {
      if (isFavorited) {
        await favoritesAPI.remove(recipe.id)
        setIsFavorited(false)
      } else {
        await favoritesAPI.add({
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
          readyInMinutes: recipe.readyInMinutes,
          proteinGrams: recipe.nutrition?.protein || 0,
          calories: recipe.nutrition?.calories || 0
        })
        setIsFavorited(true)
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
    } finally {
      setFavoriteLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="recipe-detail page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading recipe details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="recipe-detail page">
        <div className="container">
          <div className="error-state">
            <span className="emoji-large">😕</span>
            <h2>{error}</h2>
            <p>The recipe you're looking for might not exist or is unavailable.</p>
            <Link to="/" className="btn btn-primary">
              Back to Search
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!recipe) return null

  return (
    <div className="recipe-detail page fade-in">
      <div className="container">
        {/* Back link */}
        <Link to="/" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to recipes
        </Link>

        {/* Recipe Header */}
        <header className="recipe-header">
          <div className="recipe-header-content">
            <h1 className="recipe-title">{recipe.title}</h1>
            
            <div className="recipe-meta">
              <div className="meta-item">
                <span className="meta-icon">⏱️</span>
                <span>{recipe.readyInMinutes} min</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">👥</span>
                <span>{recipe.servings} servings</span>
              </div>
              {recipe.nutrition?.protein > 0 && (
                <div className="meta-item highlight">
                  <span className="meta-icon">💪</span>
                  <span>{recipe.nutrition.protein}g protein</span>
                </div>
              )}
              {recipe.nutrition?.calories > 0 && (
                <div className="meta-item">
                  <span className="meta-icon">🔥</span>
                  <span>{recipe.nutrition.calories} cal</span>
                </div>
              )}
            </div>

            {/* Diet tags */}
            {(recipe.vegetarian || recipe.vegan || recipe.glutenFree || recipe.dairyFree) && (
              <div className="diet-tags">
                {recipe.vegetarian && <span className="diet-tag">🥬 Vegetarian</span>}
                {recipe.vegan && <span className="diet-tag">🌱 Vegan</span>}
                {recipe.glutenFree && <span className="diet-tag">🌾 Gluten-Free</span>}
                {recipe.dairyFree && <span className="diet-tag">🥛 Dairy-Free</span>}
              </div>
            )}

            {/* Favorite button */}
            <button 
              className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
              onClick={handleFavoriteToggle}
              disabled={favoriteLoading}
            >
              {favoriteLoading ? (
                <span className="loading-spinner-small"></span>
              ) : isFavorited ? (
                <>❤️ Saved</>
              ) : (
                <>🤍 Save Recipe</>
              )}
            </button>
          </div>

          <div className="recipe-header-image">
            {recipe.image ? (
              <img src={recipe.image} alt={recipe.title} />
            ) : (
              <div className="image-placeholder">🍽️</div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="recipe-content">
          {/* Summary */}
          {recipe.summary && (
            <section className="recipe-section">
              <h2>About This Recipe</h2>
              <p className="recipe-summary">{recipe.summary}</p>
            </section>
          )}

          {/* Two Column Layout */}
          <div className="recipe-columns">
            {/* Ingredients */}
            <section className="recipe-section ingredients-section">
              <h2>
                <span className="section-icon">🥘</span>
                Ingredients
              </h2>
              <ul className="ingredient-list">
                {recipe.ingredients?.map((ingredient, index) => (
                  <li key={index} className="ingredient-item">
                    {ingredient.image && (
                      <img 
                        src={ingredient.image} 
                        alt={ingredient.name}
                        className="ingredient-image"
                      />
                    )}
                    <span className="ingredient-text">{ingredient.original}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Nutrition */}
            {recipe.nutrition?.nutrients?.length > 0 && (
              <section className="recipe-section nutrition-section">
                <h2>
                  <span className="section-icon">📊</span>
                  Nutrition (per serving)
                </h2>
                <div className="nutrition-grid">
                  {recipe.nutrition.nutrients.map((nutrient, index) => (
                    <div key={index} className="nutrition-item">
                      <span className="nutrition-value">
                        {nutrient.amount}{nutrient.unit}
                      </span>
                      <span className="nutrition-label">{nutrient.name}</span>
                      {nutrient.percentOfDailyNeeds > 0 && (
                        <span className="nutrition-daily">
                          {nutrient.percentOfDailyNeeds}% DV
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Instructions */}
          <section className="recipe-section instructions-section">
            <h2>
              <span className="section-icon">📝</span>
              Instructions
            </h2>
            
            {recipe.analyzedInstructions?.length > 0 ? (
              <ol className="instructions-list">
                {recipe.analyzedInstructions.map((step, index) => (
                  <li key={index} className="instruction-step">
                    <span className="step-number">{step.number}</span>
                    <span className="step-content">{step.step}</span>
                  </li>
                ))}
              </ol>
            ) : recipe.instructions ? (
              <p className="instructions-text">{recipe.instructions}</p>
            ) : (
              <p className="no-instructions">
                No detailed instructions available. 
                {recipe.sourceUrl && (
                  <> Visit the <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">original recipe</a> for full instructions.</>
                )}
              </p>
            )}
          </section>

          {/* Source link */}
          {recipe.sourceUrl && (
            <div className="recipe-source">
              <a 
                href={recipe.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="source-link"
              >
                View Original Recipe →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecipeDetail

