const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const favoritesController = {
  // Add to favorites
  async addFavorite(req, res, next) {
    try {
      const { seriesId } = req.body;
      const userId = req.user.id;

      if (!seriesId) {
        return res.status(400).json({ message: 'Series ID is required' });
      }

      // Check if series exists
      const series = await prisma.series.findUnique({
        where: { id: parseInt(seriesId) }
      });

      if (!series) {
        return res.status(404).json({ message: 'Series not found' });
      }

      // Check if already favorited
      const existing = await prisma.favorite.findUnique({
        where: {
          userId_seriesId: {
            userId,
            seriesId: parseInt(seriesId)
          }
        }
      });

      if (existing) {
        return res.status(409).json({ message: 'Series already in favorites' });
      }

      // Create favorite
      const favorite = await prisma.favorite.create({
        data: {
          userId,
          seriesId: parseInt(seriesId)
        },
        include: {
          series: {
            select: {
              id: true,
              title: true,
              posterPath: true,
              averageRating: true,
              reviewsCount: true
            }
          }
        }
      });

      res.status(201).json({
        id: favorite.id,
        seriesId: favorite.seriesId,
        addedAt: favorite.addedAt,
        series: favorite.series
      });
    } catch (error) {
      next(error);
    }
  },

  // Remove from favorites
  async removeFavorite(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Find favorite
      const favorite = await prisma.favorite.findUnique({
        where: { id: parseInt(id) }
      });

      if (!favorite) {
        return res.status(404).json({ message: 'Favorite not found' });
      }

      // Check ownership
      if (favorite.userId !== userId) {
        return res.status(403).json({ message: 'You can only remove your own favorites' });
      }

      // Delete favorite
      await prisma.favorite.delete({
        where: { id: parseInt(id) }
      });

      res.json({ message: 'Favorite removed successfully' });
    } catch (error) {
      next(error);
    }
  },

  // Get user's favorites
  async getUserFavorites(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const [favorites, total] = await Promise.all([
        prisma.favorite.findMany({
          where: { userId },
          skip,
          take: limitNum,
          orderBy: { addedAt: 'desc' },
          include: {
            series: {
              select: {
                id: true,
                title: true,
                posterPath: true,
                backdropPath: true,
                genres: true,
                releaseYear: true,
                averageRating: true,
                reviewsCount: true,
                overview: true
              }
            }
          }
        }),
        prisma.favorite.count({ where: { userId } })
      ]);

      const totalPages = Math.ceil(total / limitNum);

      const results = favorites.map(f => ({
        id: f.id,
        seriesId: f.seriesId,
        addedAt: f.addedAt,
        series: {
          ...f.series,
          genres: typeof f.series.genres === 'string' ? JSON.parse(f.series.genres) : f.series.genres
        }
      }));

      res.json({
        results,
        page: pageNum,
        totalPages,
        total
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = favoritesController;

