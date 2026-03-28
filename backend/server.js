import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import routes
import authRoutes from './routes/auth.js';
import snapsRoutes from './routes/snaps.js';
import storageRoutes from './routes/storage.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Specific parser for the storage upload route to handle large base64 screenshots securely
app.use('/api/storage/upload', express.json({ limit: '25mb' }));

// Parse JSON bodies for everything else with a safe limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// CORS configuration - Secure Settings
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500'
    ];

const extensionId = process.env.EXTENSION_ID;

app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin || // Allow requests with no origin (like curl requests or mobile apps)
      allowedOrigins.includes(origin) || // Allow explicitly defined web origins
      (extensionId && origin === `chrome-extension://${extensionId}`) || // Allow specific Chrome extension
      (!extensionId && origin.startsWith('chrome-extension://')) // Fallback for local dev without ID
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  exposedHeaders: ['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials'],
  optionsSuccessStatus: 204
}));

// Handle OPTIONS preflight requests explicitly
app.options('*', cors());



// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/snaps', snapsRoutes);
app.use('/api/storage', storageRoutes);

// Root route handler
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'ScrollNote API Server', 
    status: 'running',
    endpoints: [
      '/api/auth - Authentication endpoints',
      '/api/snaps - Screenshot management endpoints',
      '/api/storage - Storage management endpoints'
    ]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;