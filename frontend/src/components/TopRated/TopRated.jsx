import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SeriesCard from '../SeriesCard/SeriesCard'
import { seriesAPI } from '../../services/api'
import './TopRated.css'

function TopRated() {
  const navigate = useNavigate()
  const [topRatedSeries, setTopRatedSeries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopRated = async () => {
      try {
        const response = await seriesAPI.getSeries({ filter: 'top-rated', page: 1, limit: 5 })
        setTopRatedSeries(response.data.results || [])
      } catch (err) {
        console.error('Failed to fetch top-rated series:', err)
        setTopRatedSeries([])
      } finally {
        setLoading(false)
      }
    }
    fetchTopRated()
  }, [])

  const handleViewAll = () => {
    navigate('/series?filter=top-rated')
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
    <section className="top-rated-section">
      <div className="section-container">
        <div className="section-header">
          <h2 className="section-title">TOP RATED</h2>
          <button className="view-all-btn" onClick={handleViewAll}>
            VIEW ALL <i className="fas fa-arrow-right"></i>
          </button>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#e50914' }}></i>
          </div>
        ) : topRatedSeries.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No top-rated series available</p>
        ) : (
        <div className="series-grid">
            {topRatedSeries.map((series) => (
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

export default TopRated
