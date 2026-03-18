import React from 'react'
import { useNavigate } from 'react-router-dom'
import './SeriesCard.css'

function SeriesCard({ id, title, rating, genres, year, seasons, image }) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (id) {
      navigate(`/series-detail/${id}`)
    } else {
    navigate('/series-detail')
    }
  }

  return (
    <div className="series-card" onClick={handleClick}>
      <div className="poster-container">
        <div className="poster-image">
          {image ? (
            <img src={image} alt={title} />
          ) : (
            <div className="placeholder-poster"></div>
          )}
        </div>
        <div className="rating-badge">
          <i className="fas fa-star"></i>
          <span>{rating}</span>
        </div>
      </div>
      <h3 className="series-title">{title}</h3>
      <div className="genre-tags">
        {genres.length > 0 && (
          <span className={`genre-tag genre-${genres[0].toLowerCase().replace(/\s+/g, '-')}`}>
            {genres[0]}
          </span>
        )}
      </div>
      {year && seasons && (
        <p className="series-meta">{year} • {seasons}</p>
      )}
    </div>
  )
}

export default SeriesCard

