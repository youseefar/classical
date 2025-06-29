const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['gym', 'arena'],
    required: true
  },
  // Gym specific fields
  membershipType: {
    type: String,
    enum: ['weekly', 'monthly']
  },
  expiresAt: Date,
  // Arena specific fields
  date: Date,
  duration: Number,
  timeSlot: String,
  // Common fields
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  paystackReference: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Format amount as Naira
BookingSchema.methods.formatAmount = function() {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(this.amount);
};

module.exports = mongoose.model('Booking', BookingSchema);