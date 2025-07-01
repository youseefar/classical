require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const path = require('path');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');

// Initialize app
const app = express();

// Database connection (with improved error handling)
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Atlas connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
connectDB();

// Passport config (single initialization)
require('./config/passport')(passport);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session config (optimized for serverless)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
      mongoUrl: process.env.MONGO_URI,
      ttl: 24 * 60 * 60 // 1 day in seconds
    }),
    cookie: { 
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: 'lax' // Recommended for Vercel
    }
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Global variables
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Routes (deduplicated)
app.use('/', authRoutes);
app.use('/bookings', bookingRoutes);
app.use('/', require('./routes/index'));

// Request logger (simplified)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    message: 'Something broke!',
    user: req.user 
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('404', { user: req.user });
});

// Vercel-compatible export
module.exports = app;

// Local development server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Local server: http://localhost:${PORT}`);
  });
}