const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// XSS protection - handle deprecated package gracefully
let xss;
try {
  xss = require('xss-clean');
} catch (error) {
  console.warn('xss-clean package not available, using basic XSS protection');
  xss = () => (req, res, next) => next(); // No-op middleware
}

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
};

// Input sanitization middleware
const sanitizeInput = [
  // Prevent NoSQL injection attacks
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized NoSQL injection attempt: ${key} from ${req.ip}`);
    }
  }),
  
  // Prevent XSS attacks
  xss(),
  
  // Prevent HTTP Parameter Pollution
  hpp({
    whitelist: ['tags', 'categories', 'sort'] // Allow arrays for these parameters
  })
];

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip} - User: ${req.user?.username || 'Anonymous'}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Security event logging
const securityLogger = {
  logFailedAuth: (req, reason) => {
    console.warn(`Failed authentication attempt: ${reason} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  },
  
  logSuspiciousActivity: (req, activity) => {
    console.warn(`Suspicious activity detected: ${activity} - IP: ${req.ip} - User: ${req.user?.username || 'Anonymous'}`);
  },
  
  logPermissionDenied: (req, resource, permission) => {
    console.warn(`Permission denied: ${permission} on ${resource} - IP: ${req.ip} - User: ${req.user?.username || 'Anonymous'} (${req.user?.role || 'No role'})`);
  },
  
  logRateLimitExceeded: (req, limitType) => {
    console.warn(`Rate limit exceeded: ${limitType} - IP: ${req.ip} - User: ${req.user?.username || 'Anonymous'}`);
  }
};

// IP whitelist/blacklist middleware
const ipFilter = (req, res, next) => {
  const clientIP = req.ip;
  
  // Blacklisted IPs (could be stored in database)
  const blacklistedIPs = process.env.BLACKLISTED_IPS ? process.env.BLACKLISTED_IPS.split(',') : [];
  
  if (blacklistedIPs.includes(clientIP)) {
    securityLogger.logSuspiciousActivity(req, 'Blacklisted IP access attempt');
    return res.status(403).json({
      message: 'Access denied',
      code: 'IP_BLACKLISTED'
    });
  }
  
  next();
};

// Request size limiting
const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSizeBytes = parseSize(maxSize);
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        message: 'Request entity too large',
        code: 'REQUEST_TOO_LARGE',
        maxSize: maxSize
      });
    }
    
    next();
  };
};

// Helper function to parse size strings
const parseSize = (size) => {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * units[unit]);
};

// Suspicious activity detection
const suspiciousActivityDetector = (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const referer = req.get('Referer') || '';
  
  // Check for suspicious user agents
  const suspiciousUserAgents = [
    'sqlmap',
    'nikto',
    'nmap',
    'masscan',
    'nessus',
    'openvas',
    'burp',
    'w3af'
  ];
  
  if (suspiciousUserAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    securityLogger.logSuspiciousActivity(req, `Suspicious user agent: ${userAgent}`);
  }
  
  // Check for SQL injection patterns in URL
  const sqlInjectionPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i
  ];
  
  if (sqlInjectionPatterns.some(pattern => pattern.test(req.originalUrl))) {
    securityLogger.logSuspiciousActivity(req, `Potential SQL injection in URL: ${req.originalUrl}`);
  }
  
  next();
};

// Error handling for security middleware
const securityErrorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    securityLogger.logSuspiciousActivity(req, `CORS violation from origin: ${req.get('Origin')}`);
    return res.status(403).json({
      message: 'CORS policy violation',
      code: 'CORS_VIOLATION'
    });
  }
  
  next(err);
};

module.exports = {
  securityHeaders,
  corsOptions,
  sanitizeInput,
  requestLogger,
  securityLogger,
  ipFilter,
  requestSizeLimit,
  suspiciousActivityDetector,
  securityErrorHandler
};
