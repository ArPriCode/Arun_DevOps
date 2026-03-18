import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { seriesAPI } from '../../services/api'
import './Hero.css'

function Hero() {
  const navigate = useNavigate()
  const [trendingSeries, setTrendingSeries] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await seriesAPI.getSeries({ filter: 'trending', page: 1, limit: 1 })
        if (response.data.results && response.data.results.length > 0) {
          setTrendingSeries(response.data.results[0])
        }
      } catch (err) {
        console.error('Failed to fetch trending series:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTrending()
  }, [])

  const handleWatchNow = () => {
    if (trendingSeries?.id) {
      navigate(`/series-detail/${trendingSeries.id}`)
    } else {
      navigate('/series')
    }
  }

  const handleMoreInfo = () => {
    if (trendingSeries?.id) {
      navigate(`/series-detail/${trendingSeries.id}`)
    } else {
      navigate('/series')
    }
  }

  const getBackdropUrl = (backdropPath) => {
    if (!backdropPath) return null
    return backdropPath.startsWith('http') 
      ? backdropPath 
      : `https://image.tmdb.org/t/p/w1280${backdropPath}`
  }

  const getPosterUrl = (posterPath) => {
    if (!posterPath) return null
    return posterPath.startsWith('http') 
      ? posterPath 
      : `https://image.tmdb.org/t/p/w500${posterPath}`
  }

  const getGenresArray = (genres) => {
    if (Array.isArray(genres)) return genres
    if (typeof genres === 'string') {
      try {
        return JSON.parse(genres)
      } catch {
        return [genres]
      }
    }
    return []
  }

  const backdropStyle = trendingSeries?.backdropPath
    ? { backgroundImage: `url(${getBackdropUrl(trendingSeries.backdropPath)})` }
    : {}

  return (
    <section id="home" className="hero-section">
      <div className="hero-background" style={backdropStyle}>
        <div className="hero-overlay"></div>
      </div>
      <div className="hero-content">
        <div className="hero-text-content">
          <div className="trending-badge">TRENDING NOW</div>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#fff' }}></i>
            </div>
          ) : trendingSeries ? (
            <>
              <h1 className="hero-title">{trendingSeries.title || 'Trending Series'}</h1>
              <div className="hero-meta">
                <div className="rating">
                  <i className="fas fa-star"></i>
                  <span>{trendingSeries.averageRating?.toFixed(1) || '0.0'}</span>
                </div>
                {trendingSeries.releaseYear && (
                  <>
                    <span className="meta-separator">{trendingSeries.releaseYear}</span>
                    <span className="meta-separator">•</span>
                  </>
                )}
                <span className="meta-separator">{trendingSeries.reviewsCount || 0} Reviews</span>
                {getGenresArray(trendingSeries.genres).length > 0 && (
                  <>
                    <span className="meta-separator">•</span>
                    <span className="genre-badge">{getGenresArray(trendingSeries.genres)[0]}</span>
                  </>
                )}
              </div>
              <p className="hero-description">
                {trendingSeries.overview || 'A gripping tale of power, betrayal, and redemption set in a dystopian future where humanity\'s last hope lies in the hands of unlikely heroes.'}
              </p>
              <div className="hero-buttons">
                <button className="watch-now-btn" onClick={handleWatchNow}>
                  <i className="fas fa-play"></i>
                  WATCH NOW
                </button>
                <button className="more-info-btn" onClick={handleMoreInfo}>
                  <i className="fas fa-info-circle"></i>
                  MORE INFO
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="hero-title">Welcome to Cinemora</h1>
              <p className="hero-description">
                Discover and review your favorite web series
              </p>
              <div className="hero-buttons">
                <button className="watch-now-btn" onClick={() => navigate('/series')}>
                  <i className="fas fa-play"></i>
                  BROWSE SERIES
                </button>
                <button className="more-info-btn" onClick={() => navigate('/series')}>
                  <i className="fas fa-info-circle"></i>
                  EXPLORE
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default Hero

