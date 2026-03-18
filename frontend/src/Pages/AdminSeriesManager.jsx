import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'
import { seriesAPI, adminSeriesAPI } from '../services/api'
import './CSS/Series.css'

function AdminSeriesManager() {
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    id: null,
    title: '',
    overview: '',
    releaseYear: '',
    genres: '',
  })

  const resetForm = () => {
    setForm({
      id: null,
      title: '',
      overview: '',
      releaseYear: '',
      genres: '',
    })
  }

  const fetchSeries = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await seriesAPI.getSeries({ page: 1, limit: 100, sort: 'latest' })
      setSeries(res.data.results || [])
    } catch (err) {
      console.error('Failed to load series:', err)
      setError(err.response?.data?.message || 'Failed to load series')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSeries()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleEdit = (s) => {
    setForm({
      id: s.id,
      title: s.title || '',
      overview: s.overview || '',
      releaseYear: s.releaseYear || '',
      genres: Array.isArray(s.genres) ? s.genres.join(', ') : '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      alert('Title is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        overview: form.overview.trim(),
        releaseYear: form.releaseYear ? parseInt(form.releaseYear) : null,
        genres: form.genres,
      }

      if (form.id) {
        await adminSeriesAPI.updateSeries(form.id, payload)
        alert('Series updated successfully')
      } else {
        await adminSeriesAPI.createSeries(payload)
        alert('Series created successfully')
      }

      resetForm()
      await fetchSeries()
    } catch (err) {
      console.error('Failed to save series:', err)
      alert(err.response?.data?.message || 'Failed to save series')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this series?')) return

    try {
      await adminSeriesAPI.deleteSeries(id)
      alert('Series deleted (soft-delete) successfully')
      await fetchSeries()
    } catch (err) {
      console.error('Failed to delete series:', err)
      alert(err.response?.data?.message || 'Failed to delete series')
    }
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
      <section id="admin-series" className="series-section">
        <div className="series-container">
          <div className="series-header">
            <h1 className="series-page-title">ADMIN: MANAGE SERIES</h1>
            <p style={{ color: '#ccc' }}>
              Create, update, and soft-delete series. Soft-deleted series are hidden from public lists.
            </p>
          </div>

          <div className="detail-card" style={{ marginBottom: '30px' }}>
            <h2 className="detail-card-title">
              {form.id ? 'Edit Series' : 'Add New Series'}
            </h2>
            <form onSubmit={handleSubmit} className="review-form">
              <div className="review-text-section">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  name="title"
                  className="review-textarea"
                  style={{ height: '40px' }}
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="review-text-section">
                <label className="form-label">Overview</label>
                <textarea
                  name="overview"
                  className="review-textarea"
                  rows="3"
                  value={form.overview}
                  onChange={handleChange}
                />
              </div>
              <div className="review-text-section">
                <label className="form-label">Release Year</label>
                <input
                  type="number"
                  name="releaseYear"
                  className="review-textarea"
                  style={{ height: '40px' }}
                  value={form.releaseYear}
                  onChange={handleChange}
                />
              </div>
              <div className="review-text-section">
                <label className="form-label">Genres (comma separated)</label>
                <input
                  type="text"
                  name="genres"
                  className="review-textarea"
                  style={{ height: '40px' }}
                  value={form.genres}
                  onChange={handleChange}
                  placeholder="Action, Sci-Fi, Comedy"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="submit-review-btn" disabled={saving}>
                  {saving ? 'SAVING...' : form.id ? 'UPDATE SERIES' : 'CREATE SERIES'}
                </button>
                {form.id && (
                  <button
                    type="button"
                    className="submit-review-btn"
                    style={{ backgroundColor: '#666' }}
                    onClick={resetForm}
                  >
                    CANCEL
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="detail-card">
            <h2 className="detail-card-title">Existing Series</h2>
            {error && (
              <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>
            )}
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#e50914' }}></i>
                <p>Loading series...</p>
              </div>
            ) : series.length === 0 ? (
              <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                No series found.
              </p>
            ) : (
              <div className="reviews-list-profile">
                {series.map((s) => (
                  <div key={s.id} className="review-item-profile">
                    <div className="review-item-header">
                      <div>
                        <h3>{s.title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px', color: '#ccc' }}>
                          {s.releaseYear && <span>{s.releaseYear}</span>}
                          {s.releaseYear && (getGenresArray(s.genres).length > 0) && <span>•</span>}
                          {getGenresArray(s.genres).length > 0 && (
                            <span>{getGenresArray(s.genres).join(', ')}</span>
                          )}
                          <span>•</span>
                          <span>Rating: {s.averageRating?.toFixed(1) || '0.0'} ({s.reviewsCount || 0} reviews)</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="submit-review-btn"
                          style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                          onClick={() => handleEdit(s)}
                        >
                          Edit
                        </button>
                        <button
                          className="submit-review-btn"
                          style={{ padding: '6px 12px', fontSize: '0.9rem', backgroundColor: '#b91c1c' }}
                          onClick={() => handleDelete(s.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default AdminSeriesManager


