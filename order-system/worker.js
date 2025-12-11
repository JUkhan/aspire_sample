const OrderConsumer = require('./services/orderConsumer');

const INSTANCE_ID = process.env.INSTANCE_ID || `WORKER-${process.pid}`;

async function startWorker() {
  const consumer = new OrderConsumer(INSTANCE_ID);

  await consumer.connect();
  await consumer.startConsuming();

  // Display stats every 30 seconds
  setInterval(() => {
    const stats = consumer.getStats();
    console.log(
      `\n📊 [${INSTANCE_ID}] Stats: ${stats.processed} processed, ${stats.failed} failed\n`
    );
  }, 30000);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log(`\n🛑 [${INSTANCE_ID}] Shutting down worker...`);
    const stats = consumer.getStats();
    console.log(
      `   Final stats: ${stats.processed} processed, ${stats.failed} failed`
    );
    await consumer.close();
    process.exit(0);
  });
}

startWorker().catch(console.error);
