/**
 * Login Page
 * CS 409 Web Programming - UIUC Final Project
 * 
 * satisfies: login page requirement
 * satisfies: UX/UI design requirement
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

const Login = () => {
  const navigate = useNavigate()
  const { login, error, clearError } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setLocalError('')
    clearError()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.email || !formData.password) {
      setLocalError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setLocalError('')

    try {
      await login(formData.email, formData.password)
      navigate('/')
    } catch (err) {
      setLocalError(err.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container fade-in">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <span className="logo-icon">🍳</span>
            <span className="logo-text">ReciPeasy</span>
          </Link>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">
            Sign in to access your saved recipes and preferences
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {(localError || error) && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {localError || error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="auth-submit btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner-small"></span>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="auth-link">
              Sign up
            </Link>
          </p>
        </div>

        <div className="auth-features">
          <h4>Why create an account?</h4>
          <ul>
            <li>⭐ Save your favorite recipes</li>
            <li>⚙️ Store your default preferences</li>
            <li>📱 Sync across devices</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Login

