import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SeriesCard from '../SeriesCard/SeriesCard'
import { seriesAPI } from '../../services/api'
import './TrendingNow.css'

function TrendingNow() {
  const navigate = useNavigate()
  const [trendingSeries, setTrendingSeries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await seriesAPI.getSeries({ filter: 'trending', page: 1, limit: 5 })
        setTrendingSeries(response.data.results || [])
      } catch (err) {
        console.error('Failed to fetch trending series:', err)
        setTrendingSeries([])
      } finally {
        setLoading(false)
      }
    }
    fetchTrending()
  }, [])

  const handleViewAll = () => {
    navigate('/series?filter=trending')
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

  return (
    <section className="trending-section">
      <div className="section-container">
        <div className="section-header">
          <h2 className="section-title">TRENDING NOW</h2>
          <button className="view-all-btn" onClick={handleViewAll}>
            VIEW ALL <i className="fas fa-arrow-right"></i>
          </button>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#e50914' }}></i>
          </div>
        ) : trendingSeries.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No trending series available</p>
        ) : (
        <div className="series-grid">
            {trendingSeries.map((series) => (
            <SeriesCard
                key={series.id}
                id={series.id}
              title={series.title}
                rating={series.averageRating?.toFixed(1) || '0.0'}
                genres={getGenresArray(series.genres)}
                year={series.releaseYear}
                image={getPosterUrl(series.posterPath)}
            />
          ))}
        </div>
        )}
      </div>
    </section>
  )
}

export default TrendingNow
