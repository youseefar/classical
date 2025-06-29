const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('passport');
const { ensureAuthenticated } = require('../config/auth');

// Login Page
router.get('/login', (req, res) => {
  res.render('auth/login');
});

// Register Page
router.get('/register', (req, res) => {
  res.render('auth/register');
});

// Register Handle
router.post('/register', authController.register);

// Login Handle
router.post('/login', authController.login);

// Logout Handle
router.get('/logout', authController.logout);

// Dashboard
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    console.log('Rendering dashboard for user:', req.user.id);
    res.render('auth/dashboard', {
      title: 'Dashboard',
      user: req.user // Pass the entire user object
    });
  } catch (err) {
    console.error('Dashboard render error:', err);
    res.status(500).render('error', { 
      message: 'Failed to load dashboard',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
});
// Google OAuth

module.exports = router;