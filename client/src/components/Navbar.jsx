/**
 * Navbar Component - Global Navigation
 * CS 409 Web Programming - UIUC Final Project
 * 
 * satisfies: navigation component requirement
 * satisfies: display logged-in user & logout button requirement
 */

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
          <span className="logo-icon">🍳</span>
          <span className="logo-text">ReciPeasy</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-links">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            Find Recipes
          </Link>
          {isAuthenticated && (
            <Link 
              to="/saved" 
              className={`nav-link ${isActive('/saved') ? 'active' : ''}`}
            >
              Saved Recipes
            </Link>
          )}
        </div>

        {/* Auth Section */}
        <div className="navbar-auth">
          {isAuthenticated ? (
            <>
              <span className="user-email" title={user?.email}>
                {user?.email}
              </span>
              <button 
                onClick={handleLogout} 
                className="btn btn-ghost logout-btn"
                aria-label="Log out"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className={`nav-link ${isActive('/login') ? 'active' : ''}`}
              >
                Log in
              </Link>
              <Link 
                to="/signup" 
                className="btn btn-primary signup-btn"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <Link 
          to="/" 
          className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
          onClick={closeMobileMenu}
        >
          Find Recipes
        </Link>
        
        {isAuthenticated ? (
          <>
            <Link 
              to="/saved" 
              className={`mobile-nav-link ${isActive('/saved') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Saved Recipes
            </Link>
            <div className="mobile-divider"></div>
            <span className="mobile-user-email">{user?.email}</span>
            <button 
              onClick={handleLogout} 
              className="mobile-nav-link logout"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link 
              to="/login" 
              className={`mobile-nav-link ${isActive('/login') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Log in
            </Link>
            <Link 
              to="/signup" 
              className={`mobile-nav-link primary ${isActive('/signup') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Sign up
            </Link>
          </>
        )}
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-menu-overlay" 
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </nav>
  )
}

export default Navbar

