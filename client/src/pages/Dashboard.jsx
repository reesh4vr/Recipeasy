/**
 * Dashboard Page - Main Recipe Search
 * CS 409 Web Programming - UIUC Final Project
 * 
 * satisfies: Recipe Search Dashboard requirement
 * satisfies: UX/UI design requirement
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { recipesAPI, favoritesAPI } from '../services/api'
import RecipeSearchForm from '../components/RecipeSearchForm'
import FilterControls from '../components/FilterControls'
import RecipeCard from '../components/RecipeCard'
import './Dashboard.css'

const Dashboard = () => {
  const { isAuthenticated } = useAuth()
  
  // Search state
  const [recipes, setRecipes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Filter state
  const [minProtein, setMinProtein] = useState(0)
  const [maxTime, setMaxTime] = useState(180)
  const [lastIngredients, setLastIngredients] = useState('')
  
  // Favorites state
  const [favoriteIds, setFavoriteIds] = useState(new Set())

  // Load user's favorites on mount (if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites()
    }
  }, [isAuthenticated])

  const loadFavorites = async () => {
    try {
      const response = await favoritesAPI.getAll()
      const ids = new Set(response.favorites.map(f => f.recipe_id))
      setFavoriteIds(ids)
    } catch (err) {
      console.error('Error loading favorites:', err)
    }
  }

  const handleSearch = async (ingredients) => {
    setIsLoading(true)
    setError(null)
    setHasSearched(true)
    setLastIngredients(ingredients)

    try {
      const response = await recipesAPI.search({
        ingredients,
        minProtein,
        maxTime
      })
      setRecipes(response.recipes || [])
    } catch (err) {
      console.error('Search error:', err)
      setError(
        err.response?.data?.message || 
        'Unable to search recipes. Please try again.'
      )
      setRecipes([])
    } finally {
      setIsLoading(false)
    }
  }

  // Re-search when filters change (if we have ingredients)
  const handleFilterChange = () => {
    if (lastIngredients) {
      handleSearch(lastIngredients)
    }
  }

  const handleResetFilters = () => {
    setMinProtein(0)
    setMaxTime(180)
  }

  const handleFavoriteChange = () => {
    loadFavorites()
  }

  return (
    <div className="dashboard page">
      <div className="container">
        {/* Hero Search Section */}
        <section className="search-section">
          <RecipeSearchForm 
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        </section>

        {/* Main Content */}
        <div className="dashboard-content">
          {/* Sidebar with Filters */}
          <aside className="filters-sidebar">
            <FilterControls
              minProtein={minProtein}
              setMinProtein={(val) => {
                setMinProtein(val)
              }}
              maxTime={maxTime}
              setMaxTime={(val) => {
                setMaxTime(val)
              }}
              onReset={handleResetFilters}
            />
            
            {lastIngredients && (
              <button 
                className="btn btn-secondary apply-filters-btn"
                onClick={handleFilterChange}
                disabled={isLoading}
              >
                Apply Filters
              </button>
            )}

            {/* Ranking explanation */}
            <div className="ranking-info">
              <h4>🏆 How we rank recipes</h4>
              <ol>
                <li>
                  <strong>Ingredient Match</strong>
                  <span>Recipes using more of your ingredients rank higher</span>
                </li>
                <li>
                  <strong>Protein Content</strong>
                  <span>Higher protein recipes are prioritized</span>
                </li>
                <li>
                  <strong>Cooking Time</strong>
                  <span>Faster recipes rank higher when tied</span>
                </li>
              </ol>
            </div>
          </aside>

          {/* Results Area */}
          <section className="results-section">
            {/* Loading State */}
            {isLoading && (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Finding delicious recipes...</p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="error-state">
                <span className="error-icon">😕</span>
                <h3>Oops! Something went wrong</h3>
                <p>{error}</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleSearch(lastIngredients)}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Empty State - No Search Yet */}
            {!hasSearched && !isLoading && (
              <div className="empty-state welcome-state">
                <div className="welcome-illustration">
                  <span className="emoji-large">🥗</span>
                </div>
                <h3>Ready to cook something amazing?</h3>
                <p>
                  Enter the ingredients you have, and we'll find perfect recipes 
                  ranked by how many ingredients you already own.
                </p>
                <div className="feature-highlights">
                  <div className="feature-item">
                    <span className="feature-icon">📊</span>
                    <span>Smart ranking by ingredient match</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">💪</span>
                    <span>Filter by protein goals</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">⏱️</span>
                    <span>Find quick meals</span>
                  </div>
                </div>
              </div>
            )}

            {/* No Results State */}
            {hasSearched && !isLoading && !error && recipes.length === 0 && (
              <div className="empty-state no-results-state">
                <span className="emoji-large">🔍</span>
                <h3>No recipes found</h3>
                <p>
                  Try different ingredients or adjust your filters. 
                  Common ingredients like chicken, rice, or vegetables 
                  usually have more matches.
                </p>
              </div>
            )}

            {/* Results Grid */}
            {!isLoading && !error && recipes.length > 0 && (
              <>
                <div className="results-header">
                  <h2>
                    Found {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
                  </h2>
                  <p className="results-summary">
                    Ranked by ingredient match, protein, and cooking time
                  </p>
                </div>

                <div className="recipe-grid">
                  {recipes.map((recipe, index) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      isFavorited={favoriteIds.has(recipe.id)}
                      onFavoriteChange={handleFavoriteChange}
                      style={{ animationDelay: `${index * 50}ms` }}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

