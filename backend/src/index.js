require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./Middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const seriesRoutes = require('./routes/seriesRoutes');
const reviewsRoutes = require('./routes/reviewsRoutes');
const favoritesRoutes = require('./routes/favoritesRoutes');
const userRoutes = require('./routes/userRoutes');
const userPrivateRoutes = require('./routes/userPrivateRoutes');
const adminSeriesRoutes = require('./routes/adminSeriesRoutes');

const app = express();

// Trust the first proxy (Render/Heroku style) so req.ip and express-rate-limit use X-Forwarded-For safely
app.set('trust proxy', 1);

// --- Helper: normalize FRONTEND_URL env (strip quotes, add protocol if missing) ---
function normalizeOrigin(raw) {
  if (!raw) return null;
  let v = raw.trim().replace(/^['"]+|['"]+$/g, ''); // strip surrounding quotes
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v; // default to https if protocol missing
  v = v.replace(/\/$/, ''); // remove trailing slash
  return v;
}

const frontendOrigin = normalizeOrigin(process.env.FRONTEND_URL) || 'http://localhost:5173';
const allowedOrigins = [frontendOrigin, 'http://localhost:5173']; // add more if needed

// Middleware
app.use(express.json());

// Small logger to surface incoming Origin header for debugging
app.use((req, res, next) => {
  if (req.headers.origin) {
    console.log(`Incoming Origin: ${req.headers.origin}`);
  }
  next();
});

// Robust CORS configuration
// TEMPORARY — DEBUG ONLY
app.use(cors({
  origin: (origin, callback) => {
    // allow everything temporarily — browser origin will be echoed in response
    return callback(null, true);
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  credentials: true
}));

// quick preflight responder
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Request logger
app.use((req, res, next) => {
  console.log(`➡️ ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userPrivateRoutes);
app.use('/api/admin/series', adminSeriesRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Export app for testing
module.exports = app;

// Start server (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5001;
  const HOST = '0.0.0.0'; // IMPORTANT for Render
  app.listen(PORT, HOST, () => {
    console.log(`✅ Server running on http://${HOST}:${PORT}`);
  });
}


// if (process.env.NODE_ENV !== 'test') {
//   const PORT = process.env.PORT || 5001;
//   app.listen(PORT, () => {
//     console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
//   });
// }
