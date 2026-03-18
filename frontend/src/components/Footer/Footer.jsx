import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <i className="fas fa-film"></i>
              <span className="footer-logo-text">CINEMORA</span>
            </div>
            <p className="footer-description">
              Your ultimate destination for web series reviews and recommendations.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="social-link" aria-label="YouTube">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>
          
          <div className="footer-section">
            <h3 className="footer-title">QUICK LINKS</h3>
            <ul className="footer-links">
              <li><Link to="/home">Home</Link></li>
              <li><Link to="/series">Series</Link></li>
              <li><Link to="/profile">Profile</Link></li>
              <li><Link to="/login">Login</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3 className="footer-title">GENRES</h3>
            <ul className="footer-links">
              <li><a href="#action">Action</a></li>
              <li><a href="#sci-fi">Sci-Fi</a></li>
              <li><a href="#horror">Horror</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3 className="footer-title">SUPPORT</h3>
            <ul className="footer-links">
              <li><a href="#about">About Us</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 CINEMORA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

