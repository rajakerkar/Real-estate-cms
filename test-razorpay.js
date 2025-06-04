const Razorpay = require('razorpay');

// Initialize Razorpay with your key_id and key_secret
console.log('Initializing Razorpay with credentials:');
console.log('Key ID:', 'rzp_test_iS9R1nl7rLoc80');
console.log('Key Secret:', 'oV2DGma49Tzrk9TBA3xoT3nc');

const razorpay = new Razorpay({
  key_id: 'rzp_test_iS9R1nl7rLoc80',
  key_secret: 'oV2DGma49Tzrk9TBA3xoT3nc'
});

console.log('Razorpay instance created:', razorpay);

// Test function to create an order
async function testCreateOrder() {
  try {
    console.log('Creating test order...');
    const order = await razorpay.orders.create({
      amount: 50000, // 500 INR in paise
      currency: 'INR',
      receipt: 'test_receipt_' + Date.now(),
      payment_capture: 1
    });

    console.log('Order created successfully:');
    console.log(order);
    return order;
  } catch (error) {
    console.error('Error creating order:');
    console.error(error);
    throw error;
  }
}

// Run the test
testCreateOrder()
  .then(() => console.log('Test completed successfully'))
  .catch(error => console.error('Test failed:', error));
