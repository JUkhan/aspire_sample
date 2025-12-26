# Redis Streams Example with Consumer Groups

A complete example demonstrating Redis Streams for reliable message processing with replay capability and consumer coordination.

## Features Demonstrated

✅ **Reliable Message Processing** - Messages are acknowledged after successful processing
✅ **Consumer Groups** - Multiple consumers can share the workload
✅ **Replay Capability** - View historical messages at any time
✅ **Automatic Recovery** - Stale/pending messages are automatically reclaimed
✅ **Failure Handling** - Failed messages remain pending for retry

## Prerequisites

- Node.js (v14+)
- Redis Server (v5.0+)

## Installation

```bash
# Install dependencies
npm install

# Start Redis (if not running)
redis-server

# Start the application
npm start
```

## How It Works

### 1. Producer (API Endpoints)
Messages are added to the stream via HTTP API:

```bash
# Add an order to the stream
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1001,
    "product": "Laptop",
    "quantity": 2,
    "userId": 42
  }'
```

### 2. Consumer Group Processing
- Consumer group `order-processors` reads from the stream
- Messages are distributed among consumers (load balancing)
- Each message is delivered to only ONE consumer in the group
- Messages must be acknowledged after successful processing

### 3. Replay Capability
View historical messages at any time:

```bash
# Get last 50 messages
curl "http://localhost:3000/orders/history?count=50"

# Get messages in a specific range
curl "http://localhost:3000/orders/history?start=1234567890-0&end=1234567900-0"
```

### 4. Pending Message Recovery
The system automatically handles failures:

- If a consumer crashes, messages remain pending
- After 30 seconds, pending messages are reclaimed by other consumers
- Failed messages are automatically retried

```bash
# Check pending messages
curl http://localhost:3000/orders/pending
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Add new order to stream |
| GET | `/orders/history` | View message history (replay) |
| GET | `/orders/pending` | View pending/unacknowledged messages |
| GET | `/stream/info` | View stream and consumer group info |

## Testing the System

### Test Message Production and Consumption

```bash
# Terminal 1: Start the server
npm start

# Terminal 2: Send some orders
for i in {1..10}; do
  curl -X POST http://localhost:3000/orders \
    -H "Content-Type: application/json" \
    -d "{\"orderId\": $i, \"product\": \"Item-$i\", \"quantity\": 1, \"userId\": 100}"
  echo ""
done
```

Watch Terminal 1 to see messages being processed in real-time.

### Test Replay Capability

```bash
# View all historical messages
curl http://localhost:3000/orders/history

# View last 5 messages
curl "http://localhost:3000/orders/history?count=5"
```

### Test Consumer Coordination (Multiple Consumers)

```bash
# Terminal 1
npm start

# Terminal 2 (different port, same consumer group)
PORT=3001 node redis-streams-example.js

# Terminal 3: Send messages
# You'll see messages distributed between both consumers
```

### Test Failure Recovery

The code simulates a 10% failure rate. Failed messages remain pending and are automatically retried after 30 seconds.

```bash
# Check pending messages
curl http://localhost:3000/orders/pending

# Wait 30+ seconds and check again - they should be reprocessed
```

## Key Redis Streams Commands Used

- `XADD` - Add message to stream
- `XREADGROUP` - Read messages as part of consumer group
- `XACK` - Acknowledge message processing
- `XRANGE` - Read message history (for replay)
- `XPENDING` - Check pending messages
- `XCLAIM` - Claim pending messages for recovery

## Differences from Pub/Sub

| Feature | Pub/Sub | Streams |
|---------|---------|---------|
| Persistence | ❌ No | ✅ Yes |
| History/Replay | ❌ No | ✅ Yes |
| Acknowledgment | ❌ No | ✅ Yes |
| Consumer Groups | ❌ No | ✅ Yes |
| Guaranteed Delivery | ❌ No | ✅ Yes |
| Use Case | Real-time broadcasts | Reliable message queues |

## Production Considerations

1. **Set MAXLEN** - Limit stream size to prevent memory issues:
   ```javascript
   await client.xAdd(STREAM_KEY, '*', data, { MAXLEN: 10000 });
   ```

2. **Trim Old Messages** - Use `XTRIM` to remove old entries

3. **Monitor Pending** - Set up alerts for messages pending too long

4. **Dead Letter Queue** - After X retries, move messages to DLQ

5. **Multiple Instances** - Each instance should have unique consumer name

## License

MIT
