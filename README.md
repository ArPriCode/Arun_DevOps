# Cinemora - Web Series Review Platform

A full-stack web application for discovering, reviewing, and tracking your favorite TV series.

## Project Overview

Cinemora is a capstone project that provides a comprehensive platform for users to:
- Search and discover TV series using TVMaze data (seeded into local DB)
- Write and manage reviews with ratings (1-10 scale)
- Track favorite series in a personal watchlist
- View trending and top-rated series
- Browse series by genre with filtering and sorting

## Tech Stack

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: MySQL
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **External Data Source**: TVMaze (no API key needed, used for seeding)
- **Caching**: In-memory cache with TTL (Redis optional)
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React (functional components + hooks)
- **Routing**: react-router-dom
- **HTTP Client**: axios
- **Build Tool**: Vite

## Project Structure

```
DUMMY/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── Middleware/   # Auth & error handling
│   │   └── utils/        # Utilities
│   ├── prisma/           # Database schema & migrations
│   ├── tests/            # Test files
│   └── package.json
├── frontend/             # React frontend
│   ├── src/
│   │   ├── Pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── services/     # API service
│   │   └── App.jsx       # Main app component
│   └── package.json
└── README.md             # This file
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Edit `.env` with your configuration:
```env
DATABASE_URL="mysql://user:password@localhost:3306/cinemora_db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=5001
FRONTEND_URL=http://localhost:5173
CACHE_TTL=3600
```

5. Create MySQL database:
```sql
CREATE DATABASE cinemora_db;
```

6. Run migrations:
```bash
npm run migrate
# or
npx prisma migrate dev
```

7. (Optional) Seed database:
```bash
npm run seed
```

8. Start backend server:
```bash
npm start
```

Backend will run on `http://127.0.0.1:5001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## API Documentation

Base URL: `http://127.0.0.1:5001/api`

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Series
- `GET /api/series` - List/search series (query: `q`, `genre`, `sort`, `page`, `limit`, `filter`)
- `GET /api/series/:id` - Get series details with reviews

### Reviews
- `GET /api/reviews` - Get reviews (query: `seriesId`, `page`, `limit`)
- `POST /api/reviews` - Create review (auth required)
- `PUT /api/reviews/:id` - Update review (auth required)
- `DELETE /api/reviews/:id` - Delete review (auth required)

### Favorites
- `POST /api/favorites` - Add to favorites (auth required)
- `DELETE /api/favorites/:id` - Remove from favorites (auth required)
- `GET /api/user/favorites` - Get user favorites (auth required)

### User
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile (auth required)
- `GET /api/user/reviews` - Get user reviews (auth required)

> External TMDb proxy endpoints have been removed. Series data now comes from TVMaze via backend seed scripts.

See `backend/README.md` for detailed API documentation.

## Features

### ✅ Implemented

- User authentication (signup/login with JWT)
- Series search, filtering, sorting, and pagination
- Reviews CRUD with rating aggregation
- Favorites/Watchlist management
- Trending and top-rated series
- TVMaze-based seeding with caching helpers
- Responsive UI with loading states
- Error handling and validation
- Rate limiting
- Unit and integration tests

## Testing

### Backend Tests

```bash
cd backend
npm test
```

Run with coverage:
```bash
npm test -- --coverage
```

Tests cover:
- Authentication (signup/login)
- Reviews CRUD with aggregation
- Authorization (owner-only operations)

## Sample Data

After running the seed script (`npm run seed` in backend), you can login with:

- **Email**: `john@example.com` | **Password**: `password123`
- **Email**: `jane@example.com` | **Password**: `password123`
- **Email**: `mike@example.com` | **Password**: `password123`

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=mysql://user:password@localhost:3306/cinemora_db
JWT_SECRET=your-secret-key
PORT=5001
FRONTEND_URL=http://localhost:5173
CACHE_TTL=3600
```

## Database Schema

- **User**: Authentication and user profile
- **Series**: TV series metadata (seeded from TVMaze or dummy seeds)
- **Review**: User reviews with ratings (1-10)
- **Favorite**: User favorites/watchlist
- **Season/Episode**: Optional series structure

## Key Features Implementation

### Reviews Aggregation
- Series `averageRating` and `reviewsCount` are automatically recalculated transactionally when reviews are created, updated, or deleted
- Prevents race conditions with database transactions

### Caching
- TVMaze helper responses are cached in-memory with configurable TTL (default: 1 hour)
- Redis support available (commented code in `src/utils/cache.js`)

### Security
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- Rate limiting (100 requests per 15 minutes per IP)
- Authorization checks on protected routes

## Troubleshooting

### Backend Issues

**Database connection error:**
- Ensure MySQL is running
- Verify DATABASE_URL in `.env`
- Check database exists


**Port in use:**
- Change PORT in `.env` or kill process on port 5001

### Frontend Issues

**CORS errors:**
- Ensure backend is running
- Check FRONTEND_URL in backend `.env`
- Verify backend CORS configuration

**API connection errors:**
- Verify backend is running on port 5001
- Check API_BASE_URL in `src/services/api.js`

## Development Workflow

1. Start MySQL database
2. Start backend: `cd backend && npm start`
3. Start frontend: `cd frontend && npm run dev`
4. Open `http://localhost:5173` in browser

## Future Enhancements

- [ ] Redis caching for production
- [ ] Email verification
- [ ] Password reset
- [ ] Admin panel
- [ ] Advanced filtering options
- [ ] Series recommendations
- [ ] Social features (follow users, like reviews)
- [ ] Episode-level reviews

## License

ISC

## Contributing

This is a capstone project. For questions or issues, please contact the project maintainer.

