const axios = require('axios');

const API_URL = 'http://localhost:3000/orders';

async function sendOrder(orderId, product, quantity, userId) {
  try {
    const response = await axios.post(API_URL, {
      orderId,
      product,
      quantity,
      userId
    });

    console.log(`Order ${orderId} sent:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Failed to send order ${orderId}:`, error.message);
    throw error;
  }
}

async function sendMultipleOrders(count = 10) {
  console.log(`Sending ${count} orders...\n`);

  for (let i = 1; i <= count; i++) {
    await sendOrder(i, `Item-${i}`, 1, 100);
    console.log(''); // Empty line like the curl example
  }

  console.log(`\nCompleted sending ${count} orders`);
}

// Run the script
const count = parseInt(process.argv[2]) || 10;
sendMultipleOrders(count);
