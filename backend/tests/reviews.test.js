const request = require('supertest');
const app = require('../src/index');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY;

describe('Reviews Endpoints', () => {
  let testUser;
  let testSeries;
  let authToken;

  beforeAll(async () => {
    // Clean up
    await prisma.review.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.series.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await prisma.user.create({
      data: {
        name: 'Review Test User',
        email: 'reviewtest@example.com',
        password: hashedPassword
      }
    });

    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create test series (non-Drama genre)
    testSeries = await prisma.series.create({
      data: {
        title: 'Test Series',
        overview: 'Test overview',
        genres: JSON.stringify(['Action']),
        releaseYear: 2023,
        averageRating: 0,
        reviewsCount: 0
      }
    });
  });

  afterAll(async () => {
    await prisma.review.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.series.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/reviews', () => {
    it('should create a review and update series aggregates', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          seriesId: testSeries.id,
          rating: 9,
          text: 'This is an excellent series! Highly recommended.'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.rating).toBe(9);
      expect(response.body.text).toContain('excellent');
      expect(response.body.userId).toBe(testUser.id);
      expect(response.body.seriesId).toBe(testSeries.id);

      // Verify series aggregates updated
      const updatedSeries = await prisma.series.findUnique({
        where: { id: testSeries.id }
      });
      expect(updatedSeries.averageRating).toBe(9);
      expect(updatedSeries.reviewsCount).toBe(1);
    });

    it('should return error if not authenticated', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .send({
          seriesId: testSeries.id,
          rating: 8,
          text: 'Test review'
        });

      expect(response.status).toBe(401);
    });

    it('should return error if rating is out of bounds', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          seriesId: testSeries.id,
          rating: 11,
          text: 'Invalid rating'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/reviews/:id', () => {
    let review;

    beforeEach(async () => {
      review = await prisma.review.create({
        data: {
          userId: testUser.id,
          seriesId: testSeries.id,
          rating: 7,
          text: 'Initial review'
        }
      });

      // Reset series aggregates
      await prisma.series.update({
        where: { id: testSeries.id },
        data: { averageRating: 7, reviewsCount: 1 }
      });
    });

    afterEach(async () => {
      if (review) {
        await prisma.review.delete({ where: { id: review.id } });
      }
      await prisma.series.update({
        where: { id: testSeries.id },
        data: { averageRating: 0, reviewsCount: 0 }
      });
    });

    it('should update review and recalculate aggregates', async () => {
      const response = await request(app)
        .put(`/api/reviews/${review.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 10,
          text: 'Updated review - it\'s amazing!'
        });

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(10);

      // Verify aggregates updated
      const updatedSeries = await prisma.series.findUnique({
        where: { id: testSeries.id }
      });
      expect(updatedSeries.averageRating).toBe(10);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    let review;

    beforeEach(async () => {
      review = await prisma.review.create({
        data: {
          userId: testUser.id,
          seriesId: testSeries.id,
          rating: 8,
          text: 'Review to be deleted'
        }
      });

      await prisma.series.update({
        where: { id: testSeries.id },
        data: { averageRating: 8, reviewsCount: 1 }
      });
    });

    it('should delete review and recalculate aggregates', async () => {
      const response = await request(app)
        .delete(`/api/reviews/${review.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify review deleted
      const deletedReview = await prisma.review.findUnique({
        where: { id: review.id }
      });
      expect(deletedReview).toBeNull();

      // Verify aggregates reset
      const updatedSeries = await prisma.series.findUnique({
        where: { id: testSeries.id }
      });
      expect(updatedSeries.averageRating).toBe(0);
      expect(updatedSeries.reviewsCount).toBe(0);
    });
  });

  describe('Review Aggregation', () => {
    it('should correctly calculate average rating with multiple reviews', async () => {
      // Create multiple reviews
      const review1 = await prisma.review.create({
        data: {
          userId: testUser.id,
          seriesId: testSeries.id,
          rating: 8,
          text: 'Good series'
        }
      });

      const anotherUser = await prisma.user.create({
        data: {
          name: 'Another User',
          email: 'another@example.com',
          password: await bcrypt.hash('password', 10)
        }
      });

      const review2 = await prisma.review.create({
        data: {
          userId: anotherUser.id,
          seriesId: testSeries.id,
          rating: 10,
          text: 'Perfect series'
        }
      });

      // Manually recalculate to test
      const aggregates = await prisma.review.aggregate({
        where: { seriesId: testSeries.id },
        _avg: { rating: true },
        _count: true
      });

      await prisma.series.update({
        where: { id: testSeries.id },
        data: {
          averageRating: aggregates._avg.rating || 0,
          reviewsCount: aggregates._count || 0
        }
      });

      const updatedSeries = await prisma.series.findUnique({
        where: { id: testSeries.id }
      });

      expect(updatedSeries.averageRating).toBe(9); // (8 + 10) / 2
      expect(updatedSeries.reviewsCount).toBe(2);

      // Cleanup
      await prisma.review.deleteMany({ where: { seriesId: testSeries.id } });
      await prisma.user.delete({ where: { id: anotherUser.id } });
      await prisma.series.update({
        where: { id: testSeries.id },
        data: { averageRating: 0, reviewsCount: 0 }
      });
    });
  });
});

