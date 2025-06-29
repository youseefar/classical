const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const { initializePayment, verifyPayment } = require('../config/paystack');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Gym Membership Booking
router.post('/gym', ensureAuthenticated, async (req, res) => {
  try {
    const { type } = req.body;
    const amount = type === 'monthly' ? 25000 : 7500;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (type === 'monthly' ? 30 : 7));

    const booking = new Booking({
      user: req.user.id,
      type: 'gym',
      membershipType: type,
      amount,
      expiresAt,
      status: 'pending'
    });
    await booking.save();

    const paymentData = {
      email: req.user.email,
      amount: amount * 100,
      metadata: {
        bookingId: booking._id.toString(),
        bookingType: 'gym',
        userId: req.user.id
      }
    };

    const payment = await initializePayment(paymentData);
    booking.paystackReference = payment.reference;
    await booking.save();

    res.json({ 
      success: true,
      authorizationUrl: payment.authorization_url 
    });

  } catch (err) {
    console.error('Gym booking error:', err);
    res.status(500).json({ error: 'Gym booking failed' });
  }
});

// Arena Booking
router.post('/arena', ensureAuthenticated, async (req, res) => {
  try {
    const { date, duration, timeSlot } = req.body;
    let amount = 15000 * duration;
    if (duration == 2) amount = 28000;
    if (duration >= 3) amount = 40000;

    const booking = new Booking({
      user: req.user.id,
      type: 'arena',
      date: new Date(date),
      duration,
      timeSlot,
      amount,
      status: 'pending'
    });
    await booking.save();

    const paymentData = {
      email: req.user.email,
      amount: amount * 100,
      metadata: {
        bookingId: booking._id.toString(),
        bookingType: 'arena',
        userId: req.user.id
      }
    };

    const payment = await initializePayment(paymentData);
    booking.paystackReference = payment.reference;
    await booking.save();

    res.json({ 
      success: true,
      authorizationUrl: payment.authorization_url 
    });

  } catch (err) {
    console.error('Arena booking error:', err);
    res.status(500).json({ error: 'Arena booking failed' });
  }
});

// Payment Status Check
router.get('/status', ensureAuthenticated, async (req, res) => {
  try {
    // Find the most recent pending booking for this user
    const booking = await Booking.findOne({
      user: req.user.id,
      status: 'pending'
    }).sort({ createdAt: -1 });

    if (!booking) {
      return res.json({ paid: false });
    }

    // Verify payment with Paystack
    const verification = await verifyPayment(booking.paystackReference);
    if (verification.status === 'success') {
      booking.status = 'paid';
      await booking.save();

      // Add to user's account
      const updateField = booking.type === 'gym' ? 'activeMemberships' : 'arenaBookings';
      const bookingData = {
        _id: booking._id,
        amount: booking.amount,
        bookedAt: new Date()
      };

      if (booking.type === 'gym') {
        bookingData.type = booking.membershipType;
        bookingData.expiresAt = booking.expiresAt;
      } else {
        bookingData.date = booking.date;
        bookingData.duration = booking.duration;
        bookingData.timeSlot = booking.timeSlot;
      }

      await User.findByIdAndUpdate(req.user.id, {
        $push: { [updateField]: bookingData }
      });

      return res.json({ paid: true, bookingType: booking.type });
    }

    res.json({ paid: false });
  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ error: 'Status check failed' });
  }
});

module.exports = router;