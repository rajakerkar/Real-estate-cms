const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay with your key_id and key_secret
const razorpay = new Razorpay({
  key_id: 'rzp_test_iS9R1nl7rLoc80',
  key_secret: 'oV2DGma49Tzrk9TBA3xoT3nc'
});

// Create a new order
exports.createOrder = async (options) => {
  try {
    console.log('Creating order with options:', options);

    // Ensure we have the required fields
    if (!options.amount) {
      throw new Error('Amount is required');
    }

    // Ensure amount is in paise (smallest currency unit for INR)
    if (typeof options.amount === 'string') {
      options.amount = parseInt(options.amount);
    }

    // Create the order
    const order = await razorpay.orders.create(options);
    console.log('Order created successfully:', order);
    return order;
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    throw error;
  }
};

// Verify payment signature
exports.verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const generatedSignature = crypto
      .createHmac('sha256', 'oV2DGma49Tzrk9TBA3xoT3nc')
      .update(orderId + '|' + paymentId)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Razorpay signature verification error:', error);
    return false;
  }
};

// Get payment details
exports.getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Razorpay payment fetch error:', error);
    throw error;
  }
};

// Refund payment
exports.refundPayment = async (paymentId, amount = null) => {
  try {
    const options = {};
    if (amount) {
      options.amount = amount * 100;
    }

    const refund = await razorpay.payments.refund(paymentId, options);
    return refund;
  } catch (error) {
    console.error('Razorpay refund error:', error);
    throw error;
  }
};

// Export the razorpay instance
exports.razorpay = razorpay;
