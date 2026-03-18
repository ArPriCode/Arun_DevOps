import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'
import './CSS/LoginSignup.css'

function Signup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!")
      return
    }

    setLoading(true)
    try {
      const res = await authAPI.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password
      })

      if (res?.data?.token && res?.data?.user) {
        localStorage.setItem("token", res.data.token)
        localStorage.setItem("user", JSON.stringify(res.data.user))
        // Dispatch custom event to update Navbar
        window.dispatchEvent(new Event('auth-change'))
        navigate("/home")
      } else {
        alert("Signup successful! Please login.")
        navigate("/login")
      }
    } catch (err) {
      console.error("Signup failed:", err)
      const errorMessage = err.response?.data?.message || err.message || "Unknown error"
      alert("Signup failed: " + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Navbar />
      <section id="signup" className="auth-section">
        <div className="auth-background signup-bg"></div>
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <i className="fas fa-clapperboard auth-icon"></i>
              <h2 className="auth-title">JOIN CINEMORA</h2>
              <p className="auth-subtitle">Create your account and start reviewing</p>
            </div>
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">FULL NAME</label>
                <input 
                  type="text" 
                  name="name"
                  placeholder="John Doe" 
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
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
              <div className="form-group">
                <label className="form-label">CONFIRM PASSWORD</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  placeholder="••••••••" 
                  className="form-input"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </button>
            </form>
            <div className="auth-footer">
              Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default Signup

