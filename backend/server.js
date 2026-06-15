require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const connectDB = require('./config/db');

// Import pipeline functions BEFORE they are used
const { scheduleDailyScrape, ensureInitialScrape } = require('./cron/pipeline');

// Initialize Express app
const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Passport Config
require('./config/passport');

// Middleware — must be set up BEFORE routes
app.use(cors({
  origin: (process.env.CLIENT_URL || 'http://localhost:5173').trim(),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Express Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/user', require('./routes/user'));
app.use('/api/revision', require('./routes/revision'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin', require('./routes/test'));
app.use('/api/cron', require('./routes/cron'));

// Connect to MongoDB and start server once ready
connectDB()
  .then(() => {
    console.log('MongoDB connected successfully.');
    scheduleDailyScrape();

    app.listen(PORT, async () => {
      console.log(`Server listening on port ${PORT}`);
      try {
        await ensureInitialScrape();
      } catch (startupError) {
        console.error('[STARTUP ERROR] Initial scrape check failed:', startupError);
      }
    });
  })
  .catch((err) => {
    console.error('[DB CONNECTION ERROR] Failed to connect to MongoDB:', err);
    process.exit(1);
  });
