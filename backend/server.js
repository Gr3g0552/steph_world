const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 6000;

// CORS MUST be configured FIRST, before any other middleware
// This ensures CORS headers are always set, even on errors
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow all origins in development/non-production
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        
        // In production, only allow specific origins
        const allowedOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['http://localhost:3000'];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all for now - restrict in production
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Apply CORS to all routes FIRST
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests explicitly
app.options('*', cors(corsOptions));

// Middleware to ensure CORS headers are ALWAYS set, even on errors
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }
    // Store original json/status methods to ensure CORS headers are sent
    const originalJson = res.json;
    const originalStatus = res.status;
    
    res.status = function(code) {
        if (origin) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }
        return originalStatus.call(this, code);
    };
    
    res.json = function(data) {
        if (origin) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }
        return originalJson.call(this, data);
    };
    
    next();
});

// Security middleware (after CORS)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'", // Allow inline scripts
                "'unsafe-eval'", // Allow eval for Cloudflare challenge scripts
                "https://*.cloudflare.com", // Allow all Cloudflare scripts (challenges, etc.)
                "https://*.cloudflareinsights.com" // Cloudflare Insights (if enabled)
            ],
            scriptSrcElem: [
                "'self'", // Allow scripts from same origin (for Cloudflare challenge platform)
                "'unsafe-inline'", // Allow inline scripts
                "'unsafe-eval'", // Allow eval for Cloudflare challenge scripts
                "https://*.cloudflare.com", // Allow all Cloudflare scripts
                "https://*.cloudflareinsights.com", // Cloudflare Insights
                "https://steph-world.okabido.com" // Explicitly allow same origin
            ],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: [
                "'self'",
                "http://localhost:*",
                "https://*.cloudflare.com", // Allow all Cloudflare connections
                "https://*.cloudflareinsights.com", // Cloudflare Insights
                "https://*", // Allow all HTTPS connections (for API through Cloudflare)
                "http://*" // Allow all HTTP connections (for local network)
            ]
        },
    },
    crossOriginEmbedderPolicy: false,
    // Allow Cloudflare to inject scripts
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Only parse JSON and URL-encoded bodies, not multipart/form-data (handled by multer)
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// Security middleware (sanitization and validation)
const { sanitizeBody, validateId } = require('./middleware/security');
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

