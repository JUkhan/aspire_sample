import { streamReader, STREAM_KEY } from '../config/redis.js';

let io = null;
let isRunning = false;
let lastId = '$'; // Start from latest entries

/**
 * Initialize the stream consumer with Socket.io instance
 */
export function initStreamConsumer(socketIo) {
  io = socketIo;
}

/**
 * Start consuming from Redis Stream and emit to Socket.io clients
 */
export async function startConsumer() {
  if (isRunning) {
    console.log('Stream consumer already running');
    return;
  }

  isRunning = true;
  console.log('Starting Redis Stream consumer...');

  while (isRunning) {
    try {
      // XREAD with block - waits for new entries
      const results = await streamReader.xread(
        'BLOCK', 0, // Block indefinitely until new data
        'STREAMS', STREAM_KEY,
        lastId
      );

      if (results) {
        const [, entries] = results[0];

        for (const [streamId, fields] of entries) {
          lastId = streamId;

          try {
            const data = JSON.parse(fields[1]);
            const logEntry = { ...data, streamId };

            // Emit to all connected Socket.io clients
            if (io) {
              io.emit('audit:new', logEntry);
              console.log(`Emitted audit log: ${logEntry.action} - ${logEntry.resource}`);
            }
          } catch (parseError) {
            console.error('Error parsing stream entry:', parseError);
          }
        }
      }
    } catch (err) {
      if (isRunning) {
        console.error('Stream consumer error:', err);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

/**
 * Stop the stream consumer
 */
export function stopConsumer() {
  isRunning = false;
  console.log('Stopping Redis Stream consumer...');
}

export default {
  initStreamConsumer,
  startConsumer,
  stopConsumer
};
