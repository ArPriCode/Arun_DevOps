import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Check auth state on mount and when location changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      setIsLoggedIn(!!token)
    }
    
    checkAuth()
    
    // Listen for storage changes (e.g., login/logout in another tab)
    window.addEventListener('storage', checkAuth)
    
    // Also listen for custom events for same-tab updates
    window.addEventListener('auth-change', checkAuth)
    
    return () => {
      window.removeEventListener('storage', checkAuth)
      window.removeEventListener('auth-change', checkAuth)
    }
  }, [location])

  const isActive = (path) => {
    return location.pathname === path ? 'active' : ''
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('auth-change'))
    navigate('/home')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/home" className="navbar-logo">
          <i className="fas fa-film logo-icon"></i>
          <span className="logo-text">CINEMORA</span>
        </Link>
        <div className={`navbar-nav-links ${isMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/home" className={`nav-link ${isActive('/home') || isActive('/') ? 'active' : ''}`}>HOME</Link>
          <Link to="/series" className={`nav-link ${isActive('/series') ? 'active' : ''}`}>SERIES</Link>
          {isLoggedIn && (
            <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>PROFILE</Link>
          )}
          {isLoggedIn ? (
            <button onClick={handleLogout} className="login-btn logout-btn">LOGOUT</button>
          ) : (
            <Link to="/login" className="login-btn">LOGIN</Link>
          )}
        </div>
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </div>
    </nav>
  )
}

export default Navbar
