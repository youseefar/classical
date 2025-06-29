const express = require('express');
const router = express.Router();

// Home/Landing Page
router.get('/', (req, res) => {
  try {
    res.render('index', { 
      title: 'Classical Gym & Football Arena',
      user: req.user || null 
    });
  } catch (err) {
    console.error('Rendering error:', err);
    res.status(500).send('Error loading page');
  }
});

module.exports = router;