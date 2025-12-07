/**
 * FilterControls Component - Recipe search filters
 * CS 409 Web Programming - UIUC Final Project
 * 
 * satisfies: filter controls requirement
 * satisfies: UX/UI design requirement
 */

import './FilterControls.css'

const FilterControls = ({ 
  minProtein, 
  setMinProtein, 
  maxTime, 
  setMaxTime,
  onReset 
}) => {
  const handleProteinChange = (e) => {
    const value = parseInt(e.target.value) || 0
    setMinProtein(Math.max(0, Math.min(100, value)))
  }

  const handleTimeChange = (e) => {
    const value = parseInt(e.target.value) || 0
    setMaxTime(Math.max(5, Math.min(180, value)))
  }

  const hasActiveFilters = minProtein > 0 || maxTime < 180

  return (
    <div className="filter-controls">
      <div className="filter-header">
        <h4 className="filter-title">
          <span className="filter-icon">⚙️</span>
          Filters
        </h4>
        {hasActiveFilters && (
          <button 
            type="button" 
            className="filter-reset"
            onClick={onReset}
          >
            Reset
          </button>
        )}
      </div>

      <div className="filter-grid">
        {/* Minimum Protein */}
        <div className="filter-group">
          <label htmlFor="minProtein" className="filter-label">
            <span className="label-icon">💪</span>
            Min Protein
          </label>
          <div className="filter-input-group">
            <input
              type="range"
              id="minProtein"
              min="0"
              max="100"
              value={minProtein}
              onChange={handleProteinChange}
              className="filter-slider"
            />
            <div className="filter-value-display">
              <input
                type="number"
                value={minProtein}
                onChange={handleProteinChange}
                min="0"
                max="100"
                className="filter-number-input"
                aria-label="Minimum protein in grams"
              />
              <span className="filter-unit">g</span>
            </div>
          </div>
          <p className="filter-hint">
            Filter recipes with at least {minProtein}g protein
          </p>
        </div>

        {/* Maximum Cooking Time */}
        <div className="filter-group">
          <label htmlFor="maxTime" className="filter-label">
            <span className="label-icon">⏱️</span>
            Max Time
          </label>
          <div className="filter-input-group">
            <input
              type="range"
              id="maxTime"
              min="5"
              max="180"
              step="5"
              value={maxTime}
              onChange={handleTimeChange}
              className="filter-slider"
            />
            <div className="filter-value-display">
              <input
                type="number"
                value={maxTime}
                onChange={handleTimeChange}
                min="5"
                max="180"
                step="5"
                className="filter-number-input"
                aria-label="Maximum cooking time in minutes"
              />
              <span className="filter-unit">min</span>
            </div>
          </div>
          <p className="filter-hint">
            Only show recipes under {maxTime} minutes
          </p>
        </div>
      </div>
    </div>
  )
}

export default FilterControls

