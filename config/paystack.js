const Paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);

const initializePayment = async (data) => {
  try {
    const response = await Paystack.transaction.initialize({
      email: data.email,
      amount: data.amount,
      metadata: data.metadata,
      currency: 'NGN'
    });
    return response.data;
  } catch (err) {
    console.error('Paystack initialization error:', err);
    throw err;
  }
};

const verifyPayment = async (reference) => {
  try {
    const response = await Paystack.transaction.verify(reference);
    return response.data;
  } catch (err) {
    console.error('Paystack verification error:', err);
    throw err;
  }
};

module.exports = {
  initializePayment,
  verifyPayment
};