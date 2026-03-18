import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'
import SeriesCard from '../components/SeriesCard/SeriesCard'
import { userAPI, reviewsAPI, favoritesAPI } from '../services/api'
import './CSS/Profile.css'

function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('reviews') // reviews, favorites
  const [reviews, setReviews] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ reviewsCount: 0, favoritesCount: 0 })
  const [currentUser, setCurrentUser] = useState(null)
  const [reviewsPage, setReviewsPage] = useState(1)
  const [favoritesPage, setFavoritesPage] = useState(1)
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1)
  const [favoritesTotalPages, setFavoritesTotalPages] = useState(1)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const parsedUser = JSON.parse(userStr)
      setCurrentUser(parsedUser)
      fetchUserProfile(parsedUser.id)
    } else {
      navigate('/login')
    }
  }, [])

  useEffect(() => {
    if (currentUser) {
      if (activeTab === 'reviews') {
        fetchUserReviews()
      } else if (activeTab === 'favorites') {
        fetchFavorites()
      }
    }
  }, [activeTab, currentUser, reviewsPage, favoritesPage])

  const fetchUserProfile = async (userId) => {
    setLoading(true)
    try {
      const response = await userAPI.getUserProfile(userId)
      setUser(response.data)
      setStats(response.data.stats || { reviewsCount: 0, favoritesCount: 0 })
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
      if (err.response?.status === 401) {
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchUserReviews = async () => {
    try {
      const response = await userAPI.getUserReviews({ page: reviewsPage, limit: 10 })
      setReviews(response.data.items || [])
      setReviewsTotalPages(response.data.totalPages || 1)
    } catch (err) {
      console.error('Failed to fetch user reviews:', err)
      setReviews([])
    }
  }

  const fetchFavorites = async () => {
    try {
      const response = await favoritesAPI.getUserFavorites({ page: favoritesPage, limit: 10 })
      setFavorites(response.data.results || [])
      setFavoritesTotalPages(response.data.totalPages || 1)
    } catch (err) {
      console.error('Failed to fetch favorites:', err)
      setFavorites([])
    }
  }

  const handleDeleteFavorite = async (favoriteId) => {
    if (!window.confirm('Are you sure you want to remove this from favorites?')) {
      return
    }

    try {
      await favoritesAPI.removeFavorite(favoriteId)
      await fetchFavorites()
      await fetchUserProfile(currentUser.id)
      alert('Removed from favorites')
    } catch (err) {
      console.error('Failed to remove favorite:', err)
      alert(err.response?.data?.message || 'Failed to remove favorite')
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return
    }

    try {
      await reviewsAPI.deleteReview(reviewId)
      await fetchUserReviews()
      await fetchUserProfile(currentUser.id)
      alert('Review deleted successfully!')
    } catch (err) {
      console.error('Failed to delete review:', err)
      alert(err.response?.data?.message || 'Failed to delete review')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
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

  if (loading) {
    return (
      <div className="profile-page">
        <Navbar />
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#e50914' }}></i>
          <p>Loading profile...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (!user || !currentUser) {
    return (
      <div className="profile-page">
        <Navbar />
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Please login to view your profile</p>
          <button onClick={() => navigate('/login')} style={{ marginTop: '20px', padding: '10px 20px' }}>
            Go to Login
          </button>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="profile-page">
      <Navbar />
      <section id="profile" className="profile-section">
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="profile-info">
              <h1 className="profile-name">{user.name}</h1>
              <p className="profile-email">{user.email}</p>
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-value">{stats.reviewsCount}</span>
                  <span className="stat-label">Reviews</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.favoritesCount}</span>
                  <span className="stat-label">Favorites</span>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-content">
            <div className="profile-tabs">
              <button
                className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                My Reviews
              </button>
              <button
                className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
                onClick={() => setActiveTab('favorites')}
              >
                Favorites
              </button>
            </div>

            <div className="profile-content-area">
              {activeTab === 'reviews' ? (
                <>
                  {reviews.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-clipboard-list empty-icon"></i>
                <h3>No reviews yet</h3>
                <p>Start reviewing your favorite series!</p>
                      <button className="browse-btn" onClick={() => navigate('/series')}>
                        Browse Series
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="reviews-list-profile">
                        {reviews.map((review) => (
                          <div key={review.id} className="review-item-profile">
                            <div className="review-item-header">
                              <div>
                                <h3
                                  style={{ cursor: 'pointer', color: '#e50914' }}
                                  onClick={() => navigate(`/series-detail/${review.series?.id}`)}
                                >
                                  {review.series?.title || 'Unknown Series'}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                                  <div style={{ display: 'flex', gap: '3px' }}>
                                    {Array.from({ length: 10 }, (_, i) => (
                                      <i
                                        key={i}
                                        className={i < review.rating ? 'fas fa-star' : 'far fa-star'}
                                        style={{
                                          fontSize: '0.9rem',
                                          color: i < review.rating ? '#ffc107' : '#ccc',
                                          transition: 'color 0.2s ease',
                                        }}
                                      ></i>
                                    ))}
                                  </div>
                                  <span style={{ fontWeight: 'bold' }}>{review.rating}/10</span>
                                  <span>•</span>
                                  <span>{formatDate(review.createdAt)}</span>
                                </div>
                              </div>
                              <button
                                className="delete-review-btn"
                                onClick={() => handleDeleteReview(review.id)}
                                style={{ padding: '5px 15px', backgroundColor: '#e50914', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                              >
                                Delete
                              </button>
                            </div>
                            <p style={{ marginTop: '10px', color: '#ccc' }}>{review.text}</p>
                          </div>
                        ))}
                      </div>
                      {reviewsTotalPages > 1 && (
                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                          <button
                            className="pagination-btn"
                            onClick={() => setReviewsPage(reviewsPage - 1)}
                            disabled={reviewsPage === 1}
                          >
                            <i className="fas fa-chevron-left"></i> Previous
                          </button>
                          <span style={{ margin: '0 15px' }}>
                            Page {reviewsPage} of {reviewsTotalPages}
                          </span>
                          <button
                            className="pagination-btn"
                            onClick={() => setReviewsPage(reviewsPage + 1)}
                            disabled={reviewsPage === reviewsTotalPages}
                          >
                            Next <i className="fas fa-chevron-right"></i>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {favorites.length === 0 ? (
                    <div className="empty-state">
                      <i className="fas fa-heart empty-icon"></i>
                      <h3>No favorites yet</h3>
                      <p>Start adding series to your favorites!</p>
                      <button className="browse-btn" onClick={() => navigate('/series')}>
                  Browse Series
                </button>
              </div>
                  ) : (
                    <>
                      <div className="series-grid" style={{ marginTop: '20px' }}>
                        {favorites.map((favorite) => (
                          <div key={favorite.id} style={{ position: 'relative' }}>
                            <SeriesCard
                              id={favorite.series?.id}
                              title={favorite.series?.title}
                              rating={favorite.series?.averageRating?.toFixed(1) || '0.0'}
                              genres={getGenresArray(favorite.series?.genres)}
                              year={favorite.series?.releaseYear}
                              image={getPosterUrl(favorite.series?.posterPath)}
                            />
                            <button
                              onClick={() => handleDeleteFavorite(favorite.id)}
                              style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '30px',
                                height: '30px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Remove from favorites"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                      {favoritesTotalPages > 1 && (
                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                          <button
                            className="pagination-btn"
                            onClick={() => setFavoritesPage(favoritesPage - 1)}
                            disabled={favoritesPage === 1}
                          >
                            <i className="fas fa-chevron-left"></i> Previous
                          </button>
                          <span style={{ margin: '0 15px' }}>
                            Page {favoritesPage} of {favoritesTotalPages}
                          </span>
                          <button
                            className="pagination-btn"
                            onClick={() => setFavoritesPage(favoritesPage + 1)}
                            disabled={favoritesPage === favoritesTotalPages}
                          >
                            Next <i className="fas fa-chevron-right"></i>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default Profile
