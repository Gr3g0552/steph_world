const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false
}));
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['http://localhost:3000'] 
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enhanced rate limiting
const { strictLimiter, sanitizeBody, validateId, checkAdminBypass } = require('./middleware/security');
// Check admin status and apply rate limiting
app.use('/api/', (req, res, next) => {
  // Skip rate limiting for login route (has its own authLimiter)
  if ((req.path === '/auth/login' || req.originalUrl === '/api/auth/login') && req.method === 'POST') {
    return next();
  }
  
  // Check if user is admin and bypass rate limiting completely
  checkAdminBypass(req, res, () => {
    if (req.skipRateLimit === true) {
      // Admin user - skip rate limiting entirely
      return next();
    }
    // Regular user - apply rate limiting
    strictLimiter(req, res, next);
  });
});
app.use(sanitizeBody);
app.use(validateId);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/saved', require('./routes/saved'));
app.use('/api/follows', require('./routes/follows'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/homepage', require('./routes/homepage'));
app.use('/api/search', require('./routes/search'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

