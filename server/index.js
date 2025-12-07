/**
 * ReciPeasy Server - Main Entry Point
 * CS 409 Web Programming - UIUC Final Project
 *
 * satisfies: RESTful API requirement
 * satisfies: backend server requirement
 */

const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '.env') });

// Import routes
const authRoutes = require('./routes/authRoutes');
const recipesRoutes = require('./routes/recipesRoutes');
const favoritesRoutes = require('./routes/favoritesRoutes');

// Initialize Express app
const app = express();

// Connect to MongoDB
// satisfies: database requirement
connectDB();

// ----- Global Middleware -----

const parseAllowedOrigins = () => {
  const rawOrigins = process.env.CLIENT_URLS || process.env.CLIENT_URL || '';
  const parsed = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (parsed.length === 0) {
    return ['http://localhost:5173'];
  }

  return parsed;
};

const allowedOrigins = parseAllowedOrigins();
const allowAllOrigins = process.env.ALLOW_ALL_CLIENTS === 'true';

if (process.env.NODE_ENV !== 'production') {
  console.log('[cors] allowed origins:', allowAllOrigins ? 'ALL' : allowedOrigins.join(', '));
}

// CORS – allow configured frontend origins (comma-separated CLIENT_URLS)
app.use(
  cors({
    origin: allowAllOrigins ? true : allowedOrigins,
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json());

// Simple request logger (for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// ----- Routes -----

// Root route (so hitting http://localhost:5001/ works nicely)
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ReciPeasy API root',
  });
});

// API routes
// satisfies: RESTful API endpoints requirement
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/favorites', favoritesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ReciPeasy API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler (for any unmatched routes)
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ----- Start Server -----
// Default to port 5000 to match README/dev proxy
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════╗
  ║     🍳 ReciPeasy Server is Running! 🍳     ║
  ╠════════════════════════════════════════════╣
  ║  Local:  http://localhost:${PORT}         
  ║  API:    http://localhost:${PORT}/api     
  ╚════════════════════════════════════════════╝
  `);
});

module.exports = app;


