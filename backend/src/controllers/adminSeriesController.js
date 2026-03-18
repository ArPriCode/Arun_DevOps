const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cache = require('../utils/cache');

const adminSeriesController = {
  // POST /api/admin/series
  async createSeries(req, res, next) {
    try {
      const { title, overview, releaseYear, genres, posterPath, backdropPath } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Title is required' });
      }

      const data = {
        title: title.trim(),
        overview: overview || null,
        releaseYear: releaseYear ? parseInt(releaseYear) : null,
        posterPath: posterPath || null,
        backdropPath: backdropPath || null,
      };

      if (genres) {
        // Accept either array or comma-separated string
        let genresArray = genres;
        if (typeof genres === 'string') {
          genresArray = genres.split(',').map(g => g.trim()).filter(Boolean);
        }
        data.genres = genresArray;
      }

      const series = await prisma.series.create({ data });

      // Invalidate cache after mutation
      cache.clear();

      return res.status(201).json(series);
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/admin/series/:id
  async updateSeries(req, res, next) {
    try {
      const { id } = req.params;
      const { title, overview, releaseYear, genres, posterPath, backdropPath } = req.body;

      const seriesId = parseInt(id);

      const existing = await prisma.series.findUnique({ where: { id: seriesId } });
      if (!existing) {
        return res.status(404).json({ message: 'Series not found' });
      }

      const data = {};
      if (title !== undefined) data.title = title.trim();
      if (overview !== undefined) data.overview = overview;
      if (releaseYear !== undefined) data.releaseYear = releaseYear ? parseInt(releaseYear) : null;
      if (posterPath !== undefined) data.posterPath = posterPath;
      if (backdropPath !== undefined) data.backdropPath = backdropPath;

      if (genres !== undefined) {
        let genresArray = genres;
        if (typeof genres === 'string') {
          genresArray = genres.split(',').map(g => g.trim()).filter(Boolean);
        }
        data.genres = genresArray;
      }

      const updated = await prisma.series.update({
        where: { id: seriesId },
        data,
      });

      cache.clear();

      return res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/admin/series/:id (soft delete)
  async deleteSeries(req, res, next) {
    try {
      const { id } = req.params;
      const seriesId = parseInt(id);

      const existing = await prisma.series.findUnique({ where: { id: seriesId } });
      if (!existing) {
        return res.status(404).json({ message: 'Series not found' });
      }

      await prisma.series.update({
        where: { id: seriesId },
        data: {
          deletedAt: new Date(),
        },
      });

      cache.clear();

      return res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = adminSeriesController;


