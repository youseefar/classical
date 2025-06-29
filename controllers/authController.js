const passport = require('passport');
const User = require('../models/User');

exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('auth/register', {
        error: 'Email already registered',
        firstName,
        lastName,
        email
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password
    });

    // Login user after registration
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect('/dashboard');
    });

  } catch (err) {
    console.error(err);
    res.render('auth/register', {
      error: 'Registration failed. Please try again.',
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email
    });
  }
};

// ... rest of your authController remains the same

// @desc    Login user
// @route   POST /login
exports.login = (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: false
  })(req, res, next);
};

// @desc    Logout user
// @route   GET /logout
exports.logout = (req, res) => {
  req.logout(() => {
    res.redirect('/login');
  });
};

// @desc    Dashboard
// @route   GET /dashboard
exports.dashboard = async (req, res) => {
  try {
    // Fetch additional user data if needed
    const user = await User.findById(req.user.id)
      .populate('bookings')
      .lean();
      
    // Calculate stats
    const stats = {
      gymVisits: await Booking.countDocuments({ 
        user: req.user.id, 
        type: 'gym'
      }),
      footballBookings: await Booking.countDocuments({
        user: req.user.id,
        type: 'football'
      })
    };

    res.render('auth/dashboard', {
      title: 'Dashboard',
      user,
      stats,
      formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN'
        }).format(amount);
      }
    });
    
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).render('error', {
      message: 'Failed to load dashboard',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
};