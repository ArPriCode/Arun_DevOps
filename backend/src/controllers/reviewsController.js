const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to recalculate series aggregates
async function recalculateSeriesAggregates(seriesId) {
  const aggregates = await prisma.review.aggregate({
    where: { seriesId },
    _avg: { rating: true },
    _count: true
  });

  await prisma.series.update({
    where: { id: seriesId },
    data: {
      averageRating: aggregates._avg.rating || 0,
      reviewsCount: aggregates._count || 0
    }
  });
}

const reviewsController = {
  // Create a new review
  async createReview(req, res, next) {
    try {
      const { seriesId, rating, text } = req.body;
      const userId = req.user.id;

      // Validation
      if (!seriesId || !rating || !text) {
        return res.status(400).json({ message: 'Series ID, rating, and text are required' });
      }

      if (rating < 1 || rating > 10 || !Number.isInteger(Number(rating))) {
        return res.status(400).json({ message: 'Rating must be an integer between 1 and 10' });
      }

      if (text.length < 10) {
        return res.status(400).json({ message: 'Review text must be at least 10 characters' });
      }

      // Check if series exists
      const series = await prisma.series.findUnique({
        where: { id: parseInt(seriesId) }
      });

      if (!series) {
        return res.status(404).json({ message: 'Series not found' });
      }

      // Check if user already reviewed this series
      const existingReview = await prisma.review.findUnique({
        where: {
          userId_seriesId: {
            userId,
            seriesId: parseInt(seriesId)
          }
        }
      });

      // Create or update review and update aggregates in a transaction
      const review = await prisma.$transaction(async (tx) => {
        let reviewResult;
        
        if (existingReview) {
          // Update existing review
          reviewResult = await tx.review.update({
            where: { id: existingReview.id },
            data: {
              rating: parseInt(rating),
              text
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          });
        } else {
          // Create new review
          reviewResult = await tx.review.create({
            data: {
              userId,
              seriesId: parseInt(seriesId),
              rating: parseInt(rating),
              text
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          });
        }

        // Recalculate aggregates
        const aggregates = await tx.review.aggregate({
          where: { seriesId: parseInt(seriesId) },
          _avg: { rating: true },
          _count: true
        });

        await tx.series.update({
          where: { id: parseInt(seriesId) },
          data: {
            averageRating: aggregates._avg.rating || 0,
            reviewsCount: aggregates._count || 0
          }
        });

        return reviewResult;
      });

      res.status(existingReview ? 200 : 201).json({
        id: review.id,
        userId: review.userId,
        seriesId: review.seriesId,
        rating: review.rating,
        text: review.text,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        user: review.user
      });
    } catch (error) {
      next(error);
    }
  },

  // Update a review
  async updateReview(req, res, next) {
    try {
      const { id } = req.params;
      const { rating, text } = req.body;
      const userId = req.user.id;

      // Validation
      if (rating !== undefined && (rating < 1 || rating > 10 || !Number.isInteger(Number(rating)))) {
        return res.status(400).json({ message: 'Rating must be an integer between 1 and 10' });
      }

      if (text && text.length < 10) {
        return res.status(400).json({ message: 'Review text must be at least 10 characters' });
      }

      // Find review
      const review = await prisma.review.findUnique({
        where: { id: parseInt(id) },
        include: { series: true }
      });

      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      // Check ownership
      if (review.userId !== userId) {
        return res.status(403).json({ message: 'You can only update your own reviews' });
      }

      // Update review and recalculate aggregates in transaction
      const updatedReview = await prisma.$transaction(async (tx) => {
        const updated = await tx.review.update({
          where: { id: parseInt(id) },
          data: {
            ...(rating !== undefined && { rating: parseInt(rating) }),
            ...(text && { text })
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });

        // Recalculate aggregates
        const aggregates = await tx.review.aggregate({
          where: { seriesId: review.seriesId },
          _avg: { rating: true },
          _count: true
        });

        await tx.series.update({
          where: { id: review.seriesId },
          data: {
            averageRating: aggregates._avg.rating || 0,
            reviewsCount: aggregates._count || 0
          }
        });

        return updated;
      });

      res.json({
        id: updatedReview.id,
        userId: updatedReview.userId,
        seriesId: updatedReview.seriesId,
        rating: updatedReview.rating,
        text: updatedReview.text,
        createdAt: updatedReview.createdAt,
        updatedAt: updatedReview.updatedAt,
        user: updatedReview.user
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete a review
  async deleteReview(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Find review
      const review = await prisma.review.findUnique({
        where: { id: parseInt(id) }
      });

      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      // Check ownership
      if (review.userId !== userId) {
        return res.status(403).json({ message: 'You can only delete your own reviews' });
      }

      // Delete review and recalculate aggregates in transaction
      await prisma.$transaction(async (tx) => {
        await tx.review.delete({
          where: { id: parseInt(id) }
        });

        // Recalculate aggregates
        const aggregates = await tx.review.aggregate({
          where: { seriesId: review.seriesId },
          _avg: { rating: true },
          _count: true
        });

        await tx.series.update({
          where: { id: review.seriesId },
          data: {
            averageRating: aggregates._avg.rating || 0,
            reviewsCount: aggregates._count || 0
          }
        });
      });

      res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  // Get reviews (with pagination)
  async getReviews(req, res, next) {
    try {
      const { seriesId, page = 1, limit = 10 } = req.query;
      
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const where = {};
      if (seriesId) {
        where.seriesId = parseInt(seriesId);
      }

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
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
        }),
        prisma.review.count({ where })
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        items: reviews.map(r => ({
          id: r.id,
          userId: r.userId,
          seriesId: r.seriesId,
          rating: r.rating,
          text: r.text,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          user: r.user
        })),
        page: pageNum,
        totalPages,
        total
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = reviewsController;

