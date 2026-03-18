const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const seriesController = {
  // Get all series with search, filter, sort, pagination
  async getSeries(req, res, next) {
    try {
      const {
        q, // search query
        genre,
        sort = 'rating', // rating, latest, title
        page = 1,
        limit = 10,
        filter // trending, top-rated
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause (exclude soft-deleted series)
      const where = {
        deletedAt: null
      };
      
      if (q) {
        where.title = {
          contains: q
        };
      }

      // For genre filtering on JSON field, we need to use a different approach
      // MySQL JSON filtering - fetch all and filter in memory for reliability
      // This ensures we handle JSON arrays correctly regardless of case
      let genreFilteredIds = null;
      if (genre && genre !== 'All') {
        // Fetch all series to check genres (more reliable than raw SQL for JSON)
        const allSeriesForGenre = await prisma.series.findMany({
          where: {
            deletedAt: null,
            ...(q && { title: { contains: q } })
          },
          select: { id: true, genres: true }
        });
        
        // Filter by genre in memory (case-insensitive)
        const genreLower = genre.toLowerCase();
        genreFilteredIds = allSeriesForGenre
          .filter(s => {
            const genres = typeof s.genres === 'string' 
              ? JSON.parse(s.genres) 
              : (s.genres || []);
            return Array.isArray(genres) && genres.some(g => 
              String(g).toLowerCase() === genreLower
            );
          })
          .map(s => s.id);
        
        if (genreFilteredIds.length === 0) {
          // No series match the genre
          return res.json({
            results: [],
            page: pageNum,
            totalPages: 0,
            totalResults: 0
          });
        }
        where.id = { in: genreFilteredIds };
      }

      // Build orderBy
      let orderBy = {};
      if (filter === 'trending') {
        // Trending: most reviewed, then highest rated, then latest
        orderBy = [
          { reviewsCount: 'desc' },
          { averageRating: 'desc' },
          { createdAt: 'desc' }
        ];
      } else if (filter === 'top-rated') {
        // Top-rated: highest average rating, then reviews count
        orderBy = [
          { averageRating: 'desc' },
          { reviewsCount: 'desc' }
        ];
      } else {
        switch (sort) {
          case 'title':
            orderBy = { title: 'asc' };
            break;
          case 'latest':
            orderBy = { createdAt: 'desc' };
            break;
          case 'rating':
          default:
            orderBy = { averageRating: 'desc' };
            break;
        }
      }

      // Get total count
      const totalResults = await prisma.series.count({ where });

      // Get series
      const series = await prisma.series.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
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
      });

      // Parse JSON genres if stored as string
      const results = series.map(s => ({
        ...s,
        genres: typeof s.genres === 'string' ? JSON.parse(s.genres) : (s.genres || [])
      }));

      const totalPages = Math.ceil(totalResults / limitNum);

      res.json({
        results,
        page: pageNum,
        totalPages,
        totalResults
      });
    } catch (error) {
      next(error);
    }
  },

  // Get series by ID with reviews
  async getSeriesById(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Get series (exclude soft-deleted)
      const series = await prisma.series.findUnique({
        where: { id: parseInt(id) },
        include: {
          reviews: {
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              reviews: true
            }
          }
        }
      });

      if (!series || series.deletedAt) {
        return res.status(404).json({ message: 'Series not found' });
      }

      // Get total reviews count
      const totalReviews = await prisma.review.count({
        where: { seriesId: series.id }
      });

      const totalPages = Math.ceil(totalReviews / limitNum);

      // Format response
      const formattedSeries = {
        ...series,
        genres: typeof series.genres === 'string' ? JSON.parse(series.genres) : series.genres,
        reviews: {
          items: series.reviews.map(r => ({
            id: r.id,
            rating: r.rating,
            text: r.text,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            user: r.user
          })),
          page: pageNum,
          totalPages
        }
      };

      res.json({ series: formattedSeries });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = seriesController;

