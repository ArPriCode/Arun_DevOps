const request = require('supertest');
const app = require('../src/index');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

describe('Auth Endpoints', () => {
  let testUser;

  beforeAll(async () => {
    // Clean up test data
    await prisma.review.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user and return token', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user).not.toHaveProperty('password');

      // Verify token is valid
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET || process.env.SECRET_KEY);
      expect(decoded.email).toBe('test@example.com');
    });

    it('should return error if email already exists', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Another User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('should return error if fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash('password123', 10);
      testUser = await prisma.user.create({
        data: {
          name: 'Login Test User',
          email: 'logintest@example.com',
          password: hashedPassword
        }
      });
    });

    afterEach(async () => {
      if (testUser) {
        await prisma.user.delete({ where: { id: testUser.id } });
        testUser = null;
      }
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('logintest@example.com');
    });

    it('should return error with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return error if user does not exist', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid');
    });
  });
});

