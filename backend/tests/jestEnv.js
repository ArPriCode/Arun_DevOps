process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

// Mock Prisma BEFORE the app/controllers are imported by tests.
jest.mock('@prisma/client', () => require('./prismaMock'));
