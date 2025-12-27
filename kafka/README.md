# E-commerce Order Processing System with Kafka

A microservices-based order processing system demonstrating event-driven architecture using Apache Kafka. Built with Node.js, Express.js, and React.js.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    React Dashboard (:3000)                           │    │
│  │   • Order Management    • Real-time Updates    • Analytics Charts   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY (:4000)                               │
│              Express.js REST API + Kafka Producer                            │
│         POST /api/orders  →  Publishes ORDER_CREATED to Kafka               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APACHE KAFKA CLUSTER                                 │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │
│  │    orders     │ │   payments    │ │   inventory   │ │   shipping    │   │
│  │    topic      │ │    topic      │ │    topic      │ │    topic      │   │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
          │                   │                 │                 │
          ▼                   ▼                 ▼                 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           CONSUMER SERVICES                                   │
│                                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Payment   │  │  Inventory  │  │  Shipping   │  │     Analytics       │ │
│  │   Service   │  │   Service   │  │   Service   │  │      Service        │ │
│  │   (:4001)   │  │   (:4002)   │  │   (:4003)   │  │  (:4004 + WebSocket)│ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│        │                 │                │                    │             │
│        └─────────────────┴────────────────┴────────────────────┘             │
│                                    │                                          │
│                                    ▼                                          │
│                          ┌─────────────────┐                                  │
│                          │   PostgreSQL    │                                  │
│                          │    (:5432)      │                                  │
│                          └─────────────────┘                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js, Vite, TailwindCSS, Chart.js |
| Backend | Node.js, Express.js |
| Message Broker | Apache Kafka (KafkaJS) |
| Database | PostgreSQL |
| Real-time | WebSocket (ws) |
| Infrastructure | Docker, Docker Compose |

## Prerequisites

- [Docker](https://www.docker.com/get-started) & Docker Compose
- [Node.js](https://nodejs.org/) v18 or higher
- npm or yarn

## Quick Start

### 1. Start Infrastructure

```bash
# Start Kafka, Zookeeper, PostgreSQL, and Kafka UI
docker-compose up -d

# Verify containers are running
docker-compose ps
```

Wait ~30 seconds for Kafka to fully initialize.

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm install --workspaces
```

### 3. Start Services

**Option A: Start all services together**
```bash
npm run start:all
```

**Option B: Start services individually (in separate terminals)**
```bash
# Terminal 1 - API Gateway
npm run start:api

# Terminal 2 - Payment Service
npm run start:payment

# Terminal 3 - Inventory Service
npm run start:inventory

# Terminal 4 - Shipping Service
npm run start:shipping

# Terminal 5 - Analytics Service
npm run start:analytics

# Terminal 6 - React Frontend
npm run start:frontend
```

### 4. Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| React Dashboard | http://localhost:3000 | Main UI for orders & analytics |
| API Gateway | http://localhost:4000 | REST API endpoints |
| Kafka UI | http://localhost:8080 | Monitor Kafka topics & messages |
| Analytics WebSocket | ws://localhost:4004 | Real-time event stream |

## API Endpoints

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/orders` | Create a new order |
| `GET` | `/api/orders` | List all orders |
| `GET` | `/api/orders/:id` | Get order by ID |
| `GET` | `/api/orders/:id/events` | Get order event history |
| `POST` | `/api/orders/:id/cancel` | Cancel an order |
| `POST` | `/api/orders/replay` | Replay orders for testing |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/inventory` | List inventory items |
| `GET` | `/api/analytics` | Get analytics data |
| `GET` | `/api/services/status` | Health check all services |
| `GET` | `/health` | API Gateway health check |

### Example: Create Order

```bash
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST-001",
    "customerEmail": "john@example.com",
    "items": [
      {"productId": "PROD-001", "name": "Wireless Headphones", "price": 79.99, "quantity": 2},
      {"productId": "PROD-003", "name": "USB-C Hub", "price": 34.99, "quantity": 1}
    ]
  }'
```

## Kafka Topics & Events

### Topics

| Topic | Description |
|-------|-------------|
| `orders` | Order lifecycle events |
| `payments` | Payment processing events |
| `inventory` | Inventory reservation events |
| `shipping` | Shipment status events |
| `orders-replay` | Replayed orders for fraud detection |

### Event Flow

```
ORDER_CREATED (orders topic)
       │
       ├──────────────────────────────────┐
       │                                  │
       ▼                                  ▼
PAYMENT_PROCESSING              INVENTORY_RESERVED
       │                                  │
       ▼                                  │
PAYMENT_PROCESSED ◄───────────────────────┘
       │
       ▼
SHIPMENT_CREATED
       │
       ▼
SHIPMENT_DISPATCHED
       │
       ▼
SHIPMENT_DELIVERED
```

### Event Types

| Event | Producer | Description |
|-------|----------|-------------|
| `ORDER_CREATED` | API Gateway | New order placed |
| `ORDER_CANCELLED` | API Gateway | Order cancelled |
| `PAYMENT_PROCESSING` | Payment Service | Payment started |
| `PAYMENT_PROCESSED` | Payment Service | Payment successful |
| `PAYMENT_FAILED` | Payment Service | Payment declined |
| `INVENTORY_RESERVED` | Inventory Service | Stock reserved |
| `INVENTORY_RELEASED` | Inventory Service | Stock released |
| `INVENTORY_FAILED` | Inventory Service | Insufficient stock |
| `SHIPMENT_CREATED` | Shipping Service | Shipment created |
| `SHIPMENT_DISPATCHED` | Shipping Service | Package shipped |
| `SHIPMENT_DELIVERED` | Shipping Service | Package delivered |

## Order Replay (Fraud Detection Testing)

The system supports replaying historical orders to a separate Kafka topic, allowing you to test fraud detection algorithms without affecting production data.

### Via API
```bash
curl -X POST http://localhost:4000/api/orders/replay \
  -H "Content-Type: application/json" \
  -d '{"days": 7, "topic": "orders-replay"}'
```

### Via Script
```bash
# Replay last 7 days to default topic
npm run replay:orders

# Replay last 14 days
node scripts/replay-orders.js 14

# Replay to custom topic
node scripts/replay-orders.js 7 fraud-test
```

Replayed events include an `isReplay: true` flag, so consumer services can identify and handle them differently.

## Project Structure

```
ecommerce-kafka/
├── docker-compose.yml          # Infrastructure (Kafka, PostgreSQL, etc.)
├── package.json                # Root workspace configuration
│
├── shared/                     # Shared utilities
│   ├── event-types.js          # Event types, topics, helpers
│   ├── kafka-config.js         # Kafka connection utilities
│   └── index.js
│
├── services/
│   ├── api-gateway/            # REST API + Kafka Producer
│   │   └── src/
│   │       ├── index.js        # Express server
│   │       ├── routes/orders.js
│   │       ├── kafka/producer.js
│   │       └── db/index.js
│   │
│   ├── payment-service/        # Payment Kafka Consumer
│   │   └── src/
│   │       ├── index.js
│   │       ├── consumer.js
│   │       └── processor.js
│   │
│   ├── inventory-service/      # Inventory Kafka Consumer
│   │   └── src/
│   │       ├── index.js
│   │       ├── consumer.js
│   │       └── processor.js
│   │
│   ├── shipping-service/       # Shipping Kafka Consumer
│   │   └── src/
│   │       ├── index.js
│   │       ├── consumer.js
│   │       └── processor.js
│   │
│   └── analytics-service/      # Analytics + WebSocket
│       └── src/
│           ├── index.js
│           ├── consumer.js
│           └── websocket.js
│
├── frontend/                   # React Dashboard
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── OrderForm.jsx
│   │   │   ├── OrderList.jsx
│   │   │   ├── ServiceStatus.jsx
│   │   │   └── AnalyticsDashboard.jsx
│   │   ├── hooks/useWebSocket.js
│   │   └── api/orders.js
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── scripts/
    ├── init-db.sql             # Database schema
    └── replay-orders.js        # Order replay script
```

## Database Schema

### Tables

- **orders** - Order records with status tracking
- **order_events** - Event sourcing table for audit trail
- **inventory** - Product inventory with reservation tracking
- **payments** - Payment transaction records
- **shipments** - Shipment tracking with carrier info
- **analytics_daily** - Aggregated daily statistics

### Sample Inventory

The database is seeded with sample products:

| Product ID | Name | Price | Initial Stock |
|------------|------|-------|---------------|
| PROD-001 | Wireless Headphones | $79.99 | 100 |
| PROD-002 | Laptop Stand | $45.99 | 50 |
| PROD-003 | USB-C Hub | $34.99 | 200 |
| PROD-004 | Mechanical Keyboard | $129.99 | 75 |
| PROD-005 | Monitor Light Bar | $59.99 | 60 |
| PROD-006 | Webcam HD | $89.99 | 40 |
| PROD-007 | Mouse Pad XL | $24.99 | 150 |
| PROD-008 | Cable Management Kit | $19.99 | 300 |

## Key Features

### Event-Driven Architecture
- All state changes published as events to Kafka
- Services communicate asynchronously via topics
- Loose coupling between microservices

### Independent Consumer Groups
- Each service has its own Kafka consumer group
- Services can be scaled independently
- No message loss if a service is temporarily down

### Event Sourcing
- Complete audit trail of all order events
- Query event history for any order
- Enables debugging and compliance

### Idempotent Processing
- Services handle duplicate messages gracefully
- Safe message retry without side effects

### Real-time Dashboard
- WebSocket connection to Analytics Service
- Live event feed and statistics
- Interactive charts with Chart.js

### Order Replay
- Replay historical orders for testing
- Supports fraud detection system development
- Configurable time range and target topic

## Stopping the System

```bash
# Stop all Docker containers
docker-compose down

# Stop and remove volumes (clears all data)
docker-compose down -v
```

## Troubleshooting

### Kafka not ready
If services fail to connect to Kafka, wait 30 seconds after `docker-compose up` and restart the services.

### Port conflicts
Ensure ports 2181, 3000, 4000-4004, 5432, 8080, 9092 are available.

### View logs
```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f kafka
```

### Reset database
```bash
docker-compose down -v
docker-compose up -d
```

## License

MIT
