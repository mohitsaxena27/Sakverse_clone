/**
 * Main Application Server Setup
 * Configures and initializes the Express server with:
 * - Security middleware
 * - CORS configuration
 * - Route handlers
 * - Error handling
 * 
 * This server acts as a proxy between the frontend and various backend services,
 * handling authentication, session management, and request routing.
 */

// Import core and third-party modules
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression'; // Add this

// Import route handlers
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js'; 
import businessRoutes from './routes/businessRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/UploadRoute.js'
import automationRoutes from './routes/automationRoutes.js';
import tdmRoutes from './routes/tdmRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import suiteRoutes from './routes/suiteRoutes.js';
import { attachStreamServer } from "./streamer/websocket-server.mjs";
import { createProxyMiddleware } from 'http-proxy-middleware';
import { getSession } from './controllers/sessionStore.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT;
const host = process.env.HOST;
const frontendUrl = process.env.FRONTEND_URL ;
const frontendPort = process.env.FRONTEND_PORT ;
const frontendOrigin = frontendUrl; // no port — browser's real Origin has none

// =======================
// SECURITY MIDDLEWARE SETUP
// =======================

// Helmet helps secure the app by setting various HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
  })
);

// Disable Express's "X-Powered-By" header and etag caching
app.disable('x-powered-by');
app.set('etag', false);

// Add custom security headers manually
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY'); 
  res.setHeader('X-XSS-Protection', '1; mode=block'); 
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); 
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); 
  res.setHeader('Pragma', 'no-cache'); 
  next();
});

// =======================
// CORS SETUP
// =======================

const corsOptions = {
 origin: [frontendOrigin],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// =======================
// MIDDLEWARE FOR PARSING
// =======================

// ✅ FIX: Increase payload size limits
app.use(compression()); // Add compression
app.use(express.json({ limit: '100mb' })); 
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());


// Debug middleware to log requests
app.use((req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;
  
  // Capture response body for error logging
  const originalJson = res.json;
  res.json = function(data) {
    res._responseBody = data;
    return originalJson.call(this, data);
  };
  
  res.end = function(...args) {
    const duration = Date.now() - start;
    
    // Get IST time
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + istOffset);
    const dateTime = istTime.toISOString().replace('T', ' ').substring(0, 19);
    
    // Get session info
    let sessionId = req.cookies?.sessionId;
    let user = 'anonymous';
    let userRole = 'guest';
    
    if (sessionId) {
      const session = getSession(sessionId);
      if (session && session.username) {
        user = session.username;
        userRole = session.role || 'user';
      }
    }
    
    // Get IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               req.headers['x-real-ip'] ||
               req.socket?.remoteAddress || 
               req.connection?.remoteAddress ||
               'unknown';
    
    // Get clean API name (remove query params)
    const api = req.url.split('?')[0];
    
    // Determine status
    const isError = res.statusCode >= 400;
    const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
    
    // Status emoji
    let emoji = 'ℹ️';
    if (isSuccess) emoji = '✅';
    if (isError) emoji = '❌';
    if (res.statusCode >= 500) emoji = '🔥';
    
    // Build log message with design
    const separator = '─'.repeat(80);
    const logLines = [];
    
    // Header line with datetime
    logLines.push(separator);
    logLines.push(`📅 ${dateTime}`);
    
    // Main request info
    logLines.push(`${emoji} ${req.method} ${api} ${res.statusCode} (${duration}ms)`);
    
    // User info
    logLines.push(`👤 User: ${user} (${userRole})`);
    
    // IP info
    logLines.push(`🌐 IP: ${ip}`);
    
    // Session info
    logLines.push(`🔑 Session: ${sessionId ? sessionId.substring(0, 16) + '...' : 'none'}`);
    
    // Origin
    if (req.headers.origin) {
      logLines.push(`📡 Origin: ${req.headers.origin}`);
    }
    
    // Error details if error
    if (isError) {
      let errorMsg = res.statusMessage || 'Unknown error';
      try {
        if (res._responseBody) {
          const body = typeof res._responseBody === 'string' ? JSON.parse(res._responseBody) : res._responseBody;
          errorMsg = body.message || body.error || body.msg || errorMsg;
        }
      } catch (e) {}
      logLines.push(`❌ Error: ${errorMsg}`);
    }
    
    // Footer
    logLines.push(separator);
    
    // Print all lines
    console.log(logLines.join('\n'));
    
    return originalEnd.call(this, ...args);
  };
  
  next();
});

// =======================
// GLOBAL ERROR HANDLER
// =======================

app.use((err, req, res, next) => {
  // ✅ Handle 413 Payload Too Large
  if (err.status === 413 || err.type === 'entity.too.large' || err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Payload too large. Maximum allowed size is 100MB.',
      error: err.message
    });
  }
  
  if (err.message === 'CORS not allowed') {
    res.status(403).json({ 
      error: 'CORS Error', 
      message: 'Origin not allowed',
      allowedOrigins: [frontendOrigin],
    });
  } else {
    next(err); 
  }
});

// =======================
// PROXY FOR UNITE.REPORT
// =======================
app.use(
  '/sakverse/unite-login',
  createProxyMiddleware({
    target: 'http://unite.report.com:8080',
    changeOrigin: true,
    pathRewrite: {
      '^/sakverse/unite-login': '/ui/',
    },
  })
);

// =======================
// ROUTE REGISTRATIONS
// =======================

app.use('/sakverse/auth', authRoutes);
app.use('/sakverse/business', businessRoutes);
app.use('/sakverse/project', projectRoutes);
app.use('/sakverse/admin', adminRoutes);
app.use('/sakverse/upload', uploadRoutes);
app.use('/sakverse/automation', automationRoutes);
app.use('/sakverse/tdm', tdmRoutes);
app.use('/sakverse/data', dataRoutes);
app.use('/sakverse/suite', suiteRoutes);


// =======================
// HTTPS SERVER CONFIGURATION
// =======================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certs/private.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs/certificate.crt'))
};

const server = https.createServer(sslOptions, app);

// Attach WebSocket stream server
attachStreamServer(server);

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Proxy server running at ${host}:${port}`);
});