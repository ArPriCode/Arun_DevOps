import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'
import './CSS/LoginSignup.css'


function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authAPI.login(formData)
      
      if (res?.data?.token && res?.data?.user) {
        localStorage.setItem("token", res.data.token)
        localStorage.setItem("user", JSON.stringify(res.data.user))
        // Dispatch custom event to update Navbar
        window.dispatchEvent(new Event('auth-change'))
        navigate("/home")
      } else {
        alert("Login failed: token missing in response")
      }
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message || err)
      alert("Login failed: " + (err.response?.data?.message || err.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Navbar />
      <section id="login" className="auth-section">
        <div className="auth-background"></div>
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <i className="fas fa-film auth-icon"></i>
              <h2 className="auth-title">WELCOME BACK</h2>
              <p className="auth-subtitle">Login in to continue your journey</p>
            </div>
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">EMAIL</label>
                <input 
                  type="email" 
                  name="email"
                  placeholder="your@email.com" 
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">PASSWORD</label>
                <input 
                  type="password" 
                  name="password"
                  placeholder="••••••••" 
                  className="form-input"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" className="checkbox-input" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? "LOGGING IN..." : "LOGIN"}
              </button>
            </form>
            <div className="auth-footer">
              Don't have an account? <Link to="/signup" className="auth-link">Sign Up</Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default Login

