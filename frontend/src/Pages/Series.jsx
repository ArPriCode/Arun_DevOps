import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar'
import SeriesCard from '../components/SeriesCard/SeriesCard'
import Footer from '../components/Footer/Footer'
import { seriesAPI } from '../services/api'
import './CSS/Series.css'

function Series() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || 'All')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating')
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1)
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [genres] = useState(['All', 'Action', 'Comedy', 'Sci-Fi', 'Horror', 'Thriller', 'Romance', 'Crime', 'Fantasy'])

  // Fetch series data
  useEffect(() => {
    const fetchSeries = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = {
          page: currentPage,
          limit: 10
        }

        if (searchQuery.trim()) {
          params.q = searchQuery.trim()
        }

        if (selectedGenre && selectedGenre !== 'All') {
          params.genre = selectedGenre
        }

        if (sortBy) {
          params.sort = sortBy
        }

        const response = await seriesAPI.getSeries(params)
        setSeries(response.data.results || [])
        setTotalPages(response.data.totalPages || 1)
        setTotalResults(response.data.totalResults || 0)

        // Update URL params
        const newParams = new URLSearchParams()
        if (searchQuery.trim()) newParams.set('q', searchQuery.trim())
        if (selectedGenre !== 'All') newParams.set('genre', selectedGenre)
        if (sortBy !== 'rating') newParams.set('sort', sortBy)
        if (currentPage > 1) newParams.set('page', currentPage.toString())
        setSearchParams(newParams)
      } catch (err) {
        console.error('Failed to fetch series:', err)
        setError(err.response?.data?.message || 'Failed to load series')
        setSeries([])
      } finally {
        setLoading(false)
      }
    }

    // Debounce search query
    const timeoutId = setTimeout(() => {
      fetchSeries()
    }, searchQuery ? 500 : 0)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedGenre, sortBy, currentPage, setSearchParams])

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleGenreChange = (genre) => {
    setSelectedGenre(genre)
    setCurrentPage(1)
  }

  const handleSortChange = (e) => {
    setSortBy(e.target.value)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    <div className="series-page">
      <Navbar />
      <section id="series" className="series-section">
        <div className="series-container">
          <div className="series-header">
            <h1 className="series-page-title">BROWSE SERIES</h1>
            <div className="search-container">
              <div className="search-box">
                <i className="fas fa-search search-icon"></i>
                <input
                  type="text"
                  placeholder="Search for series..."
                  className="search-input"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            <div className="genre-filters">
              {genres.slice(0, 10).map((genre) => (
                <button
                  key={genre}
                  className={`genre-filter-btn ${selectedGenre === genre ? 'active' : ''}`}
                  onClick={() => handleGenreChange(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
            <div className="series-info">
              <span className="series-count">
                {loading ? 'Loading...' : `Showing ${series.length} of ${totalResults} series`}
              </span>
              <select className="sort-select" value={sortBy} onChange={handleSortChange}>
                <option value="rating">Sort by: Rating</option>
                <option value="latest">Sort by: Latest</option>
                <option value="title">Sort by: Title</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="error-message" style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {loading && series.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#e50914' }}></i>
              <p>Loading series...</p>
            </div>
          ) : series.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p>No series found. Try adjusting your search or filters.</p>
            </div>
          ) : (
          <div className="series-grid">
              {series.map((s) => (
              <SeriesCard
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  rating={s.averageRating?.toFixed(1) || '0.0'}
                  genres={getGenresArray(s.genres)}
                  year={s.releaseYear}
                  image={getPosterUrl(s.posterPath)}
              />
            ))}
          </div>
          )}

          {totalPages > 1 && (
          <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
              <i className="fas fa-chevron-left"></i>
            </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default Series
