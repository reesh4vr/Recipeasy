/**
 * Authentication Context - Global Auth State
 * CS 409 Web Programming - UIUC Final Project
 * 
 * satisfies: frontend auth state management requirement
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

/**
 * Safe hook to access auth state
 * If used outside an AuthProvider, it returns a default "logged out" state
 * instead of crashing the whole app.
 */
export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    // Failsafe so the app doesn't hard-crash with a white screen
    console.warn('useAuth used outside of AuthProvider. Returning default auth state.')

    return {
      user: null,
      loading: false,
      error: null,
      login: async () => {
        throw new Error('Auth not initialized')
      },
      signup: async () => {
        throw new Error('Auth not initialized')
      },
      logout: () => {},
      updatePreferences: async () => {
        throw new Error('Auth not initialized')
      },
      clearError: () => {},
      isAuthenticated: false,
    }
  }

  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)   // loading initial auth state
  const [error, setError] = useState(null)

  /**
   * On mount, check if we have a token and try to fetch current user
   * satisfies: persistent login / session restoration
   */
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await authAPI.getCurrentUser()
        // expected shape: { user: { ... } }
        setUser(response.user)
      } catch (err) {
        // Token invalid or expired – clear it out
        localStorage.removeItem('token')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  /**
   * Login user with email and password
   * expected authAPI.login(email, password) response:
   * { token: string, user: { ... } }
   */
  const login = async (email, password) => {
    setError(null)
    try {
      const response = await authAPI.login(email, password)
      if (!response?.token || !response?.user) {
        throw new Error('Invalid auth response. Please verify the API service URL.')
      }
      localStorage.setItem('token', response.token)
      setUser(response.user)
      return response
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed'
      setError(message)
      throw new Error(message)
    }
  }

  /**
   * Register new user
   * expected authAPI.signup(email, password) response:
   * { token: string, user: { ... } }
   */
  const signup = async (email, password) => {
    setError(null)
    try {
      const response = await authAPI.signup(email, password)
      if (!response?.token || !response?.user) {
        throw new Error('Invalid signup response. Please verify the API service URL.')
      }
      localStorage.setItem('token', response.token)
      setUser(response.user)
      return response
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Signup failed'
      setError(message)
      throw new Error(message)
    }
  }

  /**
   * Logout user – clears token and resets user
   */
  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setError(null)
  }

  /**
   * Update user preferences (e.g., protein goals, max cook time)
   * expected authAPI.updatePreferences(preferences) response:
   * { user: { ...updatedUser } }
   */
  const updatePreferences = async (preferences) => {
    try {
      const response = await authAPI.updatePreferences(preferences)
      setUser(response.user)
      return response
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update preferences'
      throw new Error(message)
    }
  }

  /**
   * Clear any auth-related error messages (for UI forms)
   */
  const clearError = () => {
    setError(null)
  }

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    updatePreferences,
    clearError,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
