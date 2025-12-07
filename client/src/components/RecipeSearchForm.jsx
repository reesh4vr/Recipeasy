/**
 * RecipeSearchForm Component - Main search input
 * CS 409 Web Programming - UIUC Final Project
 * 
 * satisfies: search bar requirement
 * satisfies: UX/UI design requirement
 */

import { useState } from 'react'
import './RecipeSearchForm.css'

const RecipeSearchForm = ({ onSearch, isLoading }) => {
  const [ingredients, setIngredients] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (ingredients.trim()) {
      onSearch(ingredients.trim())
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e)
    }
  }

  // Suggested ingredients for quick add
  const suggestions = [
    'chicken', 'rice', 'eggs', 'pasta', 
    'tomatoes', 'cheese', 'onion', 'garlic'
  ]

  const addSuggestion = (suggestion) => {
    const currentIngredients = ingredients.trim()
    if (currentIngredients) {
      // Check if already added
      const existing = currentIngredients.toLowerCase().split(',').map(i => i.trim())
      if (!existing.includes(suggestion.toLowerCase())) {
        setIngredients(`${currentIngredients}, ${suggestion}`)
      }
    } else {
      setIngredients(suggestion)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <div className="search-header">
        <h1 className="search-title">
          What's in your kitchen?
        </h1>
        <p className="search-subtitle">
          Enter your ingredients and we'll find the perfect recipes for you
        </p>
      </div>

      <div className="search-input-container">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="chicken, rice, spinach..."
            className="search-input"
            aria-label="Enter ingredients"
            disabled={isLoading}
          />
          {ingredients && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setIngredients('')}
              aria-label="Clear ingredients"
            >
              ✕
            </button>
          )}
        </div>
        
        <button 
          type="submit" 
          className="search-button btn btn-primary"
          disabled={!ingredients.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner-small"></span>
              Searching...
            </>
          ) : (
            <>
              <span>Find Recipes</span>
              <span className="btn-arrow">→</span>
            </>
          )}
        </button>
      </div>

      <div className="search-suggestions">
        <span className="suggestions-label">Quick add:</span>
        <div className="suggestions-list">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="suggestion-chip"
              onClick={() => addSuggestion(suggestion)}
            >
              + {suggestion}
            </button>
          ))}
        </div>
      </div>

      <p className="search-tip">
        💡 Tip: Separate ingredients with commas for best results
      </p>
    </form>
  )
}

export default RecipeSearchForm

