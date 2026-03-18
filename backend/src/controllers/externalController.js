const tmdbService = require('../services/tmdbService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const externalController = {
  // Proxy TMDb search
  async searchSeries(req, res, next) {
    try {
      const { query, page = 1 } = req.query;

      if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
      }

      const data = await tmdbService.searchSeries(query, parseInt(page));
      res.json(data);
    } catch (error) {
      console.error('External search error:', error);
      res.status(500).json({ message: error.message || 'Failed to search series' });
    }
  },

  // Get series details from TMDb and sync to DB
  async getSeriesDetails(req, res, next) {
    try {
      const { tmdbId } = req.params;

      if (!tmdbId) {
        return res.status(400).json({ message: 'TMDb ID is required' });
      }

      // Get from TMDb
      const tmdbData = await tmdbService.getSeriesDetails(parseInt(tmdbId));

      // Sync to local DB
      const externalId = tmdbId.toString();
      let series = await prisma.series.findUnique({
        where: { externalId }
      });

      if (!series) {
        // Create new series
        series = await prisma.series.create({
          data: {
            title: tmdbData.title,
            externalId,
            overview: tmdbData.overview || '',
            posterPath: tmdbData.posterPath,
            backdropPath: tmdbData.backdropPath,
            genres: JSON.stringify(tmdbData.genres || []),
            releaseYear: tmdbData.releaseYear,
            averageRating: 0,
            reviewsCount: 0
          }
        });
      } else {
        // Update existing series metadata
        series = await prisma.series.update({
          where: { id: series.id },
          data: {
            title: tmdbData.title,
            overview: tmdbData.overview || series.overview,
            posterPath: tmdbData.posterPath || series.posterPath,
            backdropPath: tmdbData.backdropPath || series.backdropPath,
            genres: JSON.stringify(tmdbData.genres || []),
            releaseYear: tmdbData.releaseYear || series.releaseYear
          }
        });
      }

      // Merge TMDb data with local data
      const response = {
        ...tmdbData,
        localId: series.id,
        averageRating: series.averageRating,
        reviewsCount: series.reviewsCount
      };

      res.json(response);
    } catch (error) {
      console.error('External series details error:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch series details' });
    }
  },

  // Get genres from TMDb
  async getGenres(req, res, next) {
    try {
      const genres = await tmdbService.getGenres();
      res.json(genres);
    } catch (error) {
      console.error('External genres error:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch genres' });
    }
  }
};

module.exports = externalController;

