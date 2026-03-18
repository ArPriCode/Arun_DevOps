import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'
import { seriesAPI, reviewsAPI, favoritesAPI } from '../services/api'
import './CSS/SeriesDetail.css'

function SeriesDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [series, setSeries] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteId, setFavoriteId] = useState(null)
  const [reviewsPage, setReviewsPage] = useState(1)
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }
  }, [])

  useEffect(() => {
    if (id) {
      fetchSeriesDetail()
    } else {
      setError('Series ID is required')
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (series && currentUser) {
      checkFavorite()
    }
  }, [series, currentUser])

  const fetchSeriesDetail = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await seriesAPI.getSeriesById(id, { page: reviewsPage, limit: 10 })
      setSeries(response.data.series)
      setReviews(response.data.series.reviews?.items || [])
      setReviewsTotalPages(response.data.series.reviews?.totalPages || 1)
    } catch (err) {
      console.error('Failed to fetch series:', err)
      setError(err.response?.data?.message || 'Failed to load series details')
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async (page = 1) => {
    try {
      const response = await seriesAPI.getSeriesById(id, { page, limit: 10 })
      setReviews(response.data.series.reviews?.items || [])
      setReviewsTotalPages(response.data.series.reviews?.totalPages || 1)
      setReviewsPage(page)
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    }
  }

  const checkFavorite = async () => {
    try {
      const response = await favoritesAPI.getUserFavorites()
      const favorite = response.data.results.find(f => f.seriesId === series.id)
      if (favorite) {
        setIsFavorite(true)
        setFavoriteId(favorite.id)
      }
    } catch (err) {
      console.error('Failed to check favorite:', err)
    }
  }

  const handleStarClick = (starIndex) => {
    setRating(starIndex + 1)
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!currentUser) {
      alert('Please login to submit a review')
      navigate('/login')
      return
    }

    if (reviewText.length < 10) {
      alert('Review text must be at least 10 characters')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingReview) {
        // Update existing review via PUT endpoint
        await reviewsAPI.updateReview(editingReview.id, {
          rating,
          text: reviewText
        })
        setReviewText('')
        setRating(5)
        setEditingReview(null)
        await fetchSeriesDetail()
        alert('Review updated successfully!')
      } else {
        // Create or update review (createReview now handles updates automatically)
        const response = await reviewsAPI.createReview({
          seriesId: parseInt(id),
          rating,
          text: reviewText
        })
        setReviewText('')
        setRating(5)
        setEditingReview(null)
        await fetchSeriesDetail()
        // Check response status to determine if it was created (201) or updated (200)
        const isUpdate = response.status === 200
        alert(isUpdate ? 'Review updated successfully!' : 'Review submitted successfully!')
      }
    } catch (err) {
      console.error('Failed to submit review:', err)
      alert(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditReview = (review) => {
    setEditingReview(review)
    setRating(review.rating)
    setReviewText(review.text)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingReview(null)
    setRating(5)
    setReviewText('')
  }

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return
    }

    try {
      await reviewsAPI.deleteReview(reviewId)
      await fetchSeriesDetail()
      alert('Review deleted successfully!')
    } catch (err) {
      console.error('Failed to delete review:', err)
      alert(err.response?.data?.message || 'Failed to delete review')
    }
  }

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      alert('Please login to add to favorites')
      navigate('/login')
      return
    }

    try {
      if (isFavorite) {
        await favoritesAPI.removeFavorite(favoriteId)
        setIsFavorite(false)
        setFavoriteId(null)
        alert('Removed from favorites')
      } else {
        const response = await favoritesAPI.addFavorite({ seriesId: parseInt(id) })
        setIsFavorite(true)
        setFavoriteId(response.data.id)
        alert('Added to favorites')
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
      alert(err.response?.data?.message || 'Failed to update favorites')
    }
  }

  const getPosterUrl = (posterPath) => {
    if (!posterPath) return null
    return posterPath.startsWith('http') 
      ? posterPath 
      : `https://image.tmdb.org/t/p/w500${posterPath}`
  }

  const getBackdropUrl = (backdropPath) => {
    if (!backdropPath) return null
    return backdropPath.startsWith('http')
      ? backdropPath
      : `https://image.tmdb.org/t/p/w1280${backdropPath}`
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

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const getUserInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="series-detail-page">
        <Navbar />
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#e50914' }}></i>
          <p>Loading series details...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !series) {
    return (
      <div className="series-detail-page">
        <Navbar />
        <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
          <p>{error || 'Series not found'}</p>
          <button onClick={() => navigate('/series')} style={{ marginTop: '20px', padding: '10px 20px' }}>
            Back to Series
          </button>
        </div>
        <Footer />
      </div>
    )
  }

  const backdropStyle = series.backdropPath
    ? { backgroundImage: `url(${getBackdropUrl(series.backdropPath)})` }
    : {}

  return (
    <div className="series-detail-page">
      <Navbar />
      
      {/* Banner Section */}
      <section className="series-banner-section">
        <div className="banner-background" style={backdropStyle}></div>
        <div className="banner-overlay"></div>
        <div className="banner-content">
          <div className="banner-info">
            <h1 className="series-detail-title">{series.title}</h1>
            <div className="series-detail-meta">
              <div className="rating-display">
                <i className="fas fa-star"></i>
                <span className="rating-value">{series.averageRating?.toFixed(1) || '0.0'}</span>
                <span className="rating-max">/10</span>
              </div>
              {series.releaseYear && (
                <>
                  <span className="meta-separator">•</span>
                  <span className="meta-text">{series.releaseYear}</span>
                </>
              )}
              <span className="meta-separator">•</span>
              <span className="meta-text">{series.reviewsCount || 0} Reviews</span>
            </div>
            <div className="series-genre-tags">
              {getGenresArray(series.genres).map((genre, idx) => (
                <span key={idx} className={`genre-tag-detail genre-${genre.toLowerCase().replace(/\s+/g, '-')}`}>
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="series-detail-content">
        <div className="detail-container">
          <div className="detail-grid">
            {/* Left Column - Main Content */}
            <div className="detail-main">
              {/* Synopsis */}
              <div className="detail-card">
                <h2 className="detail-card-title">Synopsis</h2>
                <p className="synopsis-text">
                  {series.overview || 'No synopsis available.'}
                </p>
              </div>

              {/* Write a Review */}
              {currentUser && (
                <div className="detail-card">
                  <h2 className="detail-card-title">
                    {editingReview ? 'Edit Review' : 'Write a Review'}
                  </h2>
                  <form className="review-form" onSubmit={handleSubmitReview}>
                    <div className="rating-input-section">
                      <label className="form-label">Your Rating (1-10)</label>
                      <div className="star-rating">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                          <i
                            key={star}
                            className={`star-icon ${star <= rating ? 'fas fa-star filled' : 'far fa-star'}`}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => {
                              // Optional: Add hover effect if desired
                            }}
                            style={{ 
                              cursor: 'pointer', 
                              fontSize: '1.5rem', 
                              marginRight: '5px',
                              color: star <= rating ? '#ffc107' : '#ccc',
                              transition: 'color 0.2s ease'
                            }}
                            title={`${star}/10`}
                          ></i>
                        ))}
                        <span style={{ marginLeft: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                          {rating}/10
                        </span>
                      </div>
                    </div>
                    <div className="review-text-section">
                      <label className="form-label">Your Review</label>
                      <textarea
                        className="review-textarea"
                        placeholder="Share your thoughts about this series..."
                        rows="4"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        required
                        minLength={10}
                      ></textarea>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="submit" className="submit-review-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'SUBMITTING...' : editingReview ? 'UPDATE REVIEW' : 'SUBMIT REVIEW'}
                      </button>
                      {editingReview && (
                        <button type="button" className="submit-review-btn" onClick={handleCancelEdit} style={{ backgroundColor: '#666' }}>
                          CANCEL
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* User Reviews */}
              <div className="detail-card">
                <div className="reviews-header">
                  <h2 className="detail-card-title">User Reviews ({series.reviewsCount || 0})</h2>
                </div>
                {reviews.length === 0 ? (
                  <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    No reviews yet. Be the first to review!
                  </p>
                ) : (
                  <div className="reviews-list">
                    {reviews.map((review) => (
                      <div key={review.id} className="review-item">
                        <div className="review-header">
                          <div className="review-avatar">
                            {getUserInitials(review.user?.name)}
                          </div>
                          <div className="review-info">
                            <div className="review-meta">
                              <span className="review-author">{review.user?.name || 'Anonymous'}</span>
                              <span className="review-date">{formatDate(review.createdAt)}</span>
                            </div>
                            <div className="review-rating">
                              {Array.from({ length: 10 }, (_, i) => (
                                <i
                                  key={i}
                                  className={i < review.rating ? 'fas fa-star' : 'far fa-star'}
                                  style={{ 
                                    fontSize: '0.9rem', 
                                    color: i < review.rating ? '#ffc107' : '#ccc',
                                    marginRight: '2px'
                                  }}
                                ></i>
                              ))}
                              <span className="review-rating-value" style={{ marginLeft: '8px' }}>
                                {review.rating}/10
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="review-text">{review.text}</p>
                        {currentUser && currentUser.id === review.userId && (
                          <div className="review-actions">
                            <button
                              className="review-action-btn edit-btn"
                              onClick={() => handleEditReview(review)}
                            >
                              Edit
                            </button>
                            <button
                              className="review-action-btn delete-btn"
                              onClick={() => handleDeleteReview(review.id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {reviewsTotalPages > 1 && (
                  <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button
                      className="pagination-btn"
                      onClick={() => fetchReviews(reviewsPage - 1)}
                      disabled={reviewsPage === 1}
                    >
                      <i className="fas fa-chevron-left"></i> Previous
                    </button>
                    <span style={{ margin: '0 15px' }}>
                      Page {reviewsPage} of {reviewsTotalPages}
                    </span>
                    <button
                      className="pagination-btn"
                      onClick={() => fetchReviews(reviewsPage + 1)}
                      disabled={reviewsPage === reviewsTotalPages}
                    >
                      Next <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="detail-sidebar">
              {/* Action Buttons */}
              <div className="detail-card">
                <button
                  className={isFavorite ? "watchlist-btn" : "watchlist-btn"}
                  onClick={handleToggleFavorite}
                  style={{ 
                    backgroundColor: isFavorite ? '#e50914' : '#333',
                    width: '100%',
                    marginBottom: '10px'
                  }}
                >
                  <i className={`fas ${isFavorite ? 'fa-heart' : 'fa-plus'}`}></i>
                  {isFavorite ? 'REMOVE FROM FAVORITES' : 'ADD TO FAVORITES'}
                </button>
                <button className="share-btn" onClick={() => navigator.share?.({ title: series.title, url: window.location.href }) || navigator.clipboard.writeText(window.location.href)}>
                  <i className="fas fa-share-alt"></i>
                  SHARE
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default SeriesDetail
