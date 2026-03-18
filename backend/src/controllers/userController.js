const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const userController = {
  // Get user profile
  async getUserProfile(req, res, next) {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      // Get user with stats
      const [user, reviewsCount, favoritesCount] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        }),
        prisma.review.count({ where: { userId } }),
        prisma.favorite.count({ where: { userId } })
      ]);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        ...user,
        stats: {
          reviewsCount,
          favoritesCount
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update user profile
  async updateUserProfile(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { name, email } = req.body;

      // Check if user is updating their own profile
      if (parseInt(id) !== userId) {
        return res.status(403).json({ message: 'You can only update your own profile' });
      }

      // Validation
      if (!name && !email) {
        return res.status(400).json({ message: 'Name or email required' });
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (email) {
        // Check if email is already taken
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing && existing.id !== userId) {
          return res.status(409).json({ message: 'Email already in use' });
        }
        updateData.email = email;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      });

      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  },

  // Get logged-in user's reviews
  async getUserReviews(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { userId },
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
          include: {
            series: {
              select: {
                id: true,
                title: true,
                posterPath: true,
                averageRating: true
              }
            }
          }
        }),
        prisma.review.count({ where: { userId } })
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        items: reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          text: r.text,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          series: r.series
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

module.exports = userController;

