# Cinemora Backend

Web Series Review Platform - Backend API

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **External Data Source**: TVMaze (no API key needed, used for seeding)
- **Caching**: In-memory cache with TTL (Redis optional)

## Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Create a `.env` file in the `backend` directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/cinemora_db"

# JWT Secret (use a strong random string in production)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
SECRET_KEY="your-super-secret-jwt-key-change-this-in-production"

# Server
PORT=5001
FRONTEND_URL=http://localhost:5173

# Cache TTL (in seconds, default: 3600 = 1 hour)
CACHE_TTL=3600
```

### 3. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE cinemora_db;
```

Run Prisma migrations:

```bash
npx prisma migrate dev
```

This will:
- Generate Prisma Client
- Apply database migrations
- Create all required tables

### 4. Seed Database (Optional)

Populate the database with sample data:

```bash
npm run seed
```

Sample login credentials after seeding:
- Email: `john@example.com`, Password: `password123`
- Email: `jane@example.com`, Password: `password123`
- Email: `mike@example.com`, Password: `password123`

### 5. Start Server

Development mode (with nodemon):

```bash
npm start
```

Or manually:

```bash
node src/index.js
```

Server will run on `http://127.0.0.1:5001`

## API Endpoints

### Base URL
`http://127.0.0.1:5001/api`

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login and get JWT token

### Series
- `GET /api/series` - Get series list (supports query params: `q`, `genre`, `sort`, `page`, `limit`, `filter`)
- `GET /api/series/:id` - Get series details with reviews

### Reviews
- `GET /api/reviews` - Get reviews (query params: `seriesId`, `page`, `limit`)
- `POST /api/reviews` - Create review (auth required)
- `PUT /api/reviews/:id` - Update review (auth required, owner only)
- `DELETE /api/reviews/:id` - Delete review (auth required, owner only)

### Favorites
- `POST /api/favorites` - Add to favorites (auth required)
- `DELETE /api/favorites/:id` - Remove from favorites (auth required)
- `GET /api/user/favorites` - Get user's favorites (auth required)

### User
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile (auth required)
- `GET /api/user/reviews` - Get logged-in user's reviews (auth required)

> External TMDb proxy endpoints have been removed. Series data is now populated from TVMaze via backend seed scripts.

## Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm test -- --coverage
```

Watch mode:

```bash
npm run test:watch
```

## Project Structure

```
backend/
├── src/
│   ├── controllers/      # Route handlers
│   ├── routes/           # API routes
│   ├── services/         # Business logic (TVMaze service, etc.)
│   ├── Middleware/       # Auth & error handlers
│   ├── utils/            # Utilities (cache)
│   └── index.js          # Entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── seed.js           # Seed script
├── tests/                # Test files
├── .env.example          # Environment variables template
└── package.json
```

## Database Models

- **User**: id, name, email, password, createdAt
- **Series**: id, title, externalId, overview, posterPath, backdropPath, genres, releaseYear, averageRating, reviewsCount
- **Review**: id, userId, seriesId, rating (1-10), text, createdAt, updatedAt
- **Favorite**: id, userId, seriesId, addedAt
- **Season**: id, seriesId, seasonNumber, name, overview, airDate
- **Episode**: id, seasonId, episodeNumber, name, overview, airDate, runtime

## Features

- ✅ JWT-based authentication
- ✅ Reviews CRUD with transactional aggregation
- ✅ Series search, filter, sort, pagination
- ✅ Favorites/Watchlist management
- ✅ TVMaze-based seeding with caching helpers
- ✅ Rate limiting
- ✅ Input validation
- ✅ Error handling
- ✅ Tests for auth and reviews

## Rate Limiting

API requests are rate-limited to 100 requests per 15 minutes per IP address.

## Caching

TVMaze helper responses are cached in-memory with a default TTL of 1 hour. To use Redis instead, uncomment the Redis cache code in `src/utils/cache.js`.

## Notes

- All passwords are hashed using bcrypt (10 rounds)
- JWT tokens expire after 7 days
- Reviews aggregation (averageRating, reviewsCount) is recalculated transactionally on create/update/delete
- One review per user per series (enforced by unique constraint)

## Troubleshooting

**Database connection error:**
- Check MySQL is running
- Verify DATABASE_URL in `.env`
- Ensure database exists


**Port already in use:**
- Change PORT in `.env` or kill process using port 5001

## License

ISC

