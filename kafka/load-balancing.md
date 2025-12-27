# Load Balancing & Scaling Guide

This guide explains how to scale the E-commerce Order Processing System horizontally by running multiple service replicas and configuring Kafka partitions for optimal load distribution.

## Table of Contents

- [Understanding Kafka Partitions](#understanding-kafka-partitions)
- [Consumer Groups & Load Balancing](#consumer-groups--load-balancing)
- [Scaling Strategy](#scaling-strategy)
- [Configuring Kafka Partitions](#configuring-kafka-partitions)
- [Running Multiple Service Replicas](#running-multiple-service-replicas)
- [Docker Compose Scaling](#docker-compose-scaling)
- [Kubernetes Deployment](#kubernetes-deployment)
- [API Gateway Load Balancing](#api-gateway-load-balancing)
- [Database Considerations](#database-considerations)
- [Monitoring & Metrics](#monitoring--metrics)

---

## Understanding Kafka Partitions

### What Are Partitions?

Partitions are the unit of parallelism in Kafka. Each topic is divided into partitions, and each partition can be consumed by only **one consumer per consumer group** at a time.

```
                        orders topic
┌─────────────────────────────────────────────────────────┐
│  Partition 0  │  Partition 1  │  Partition 2  │  ...   │
│  [msg1, msg4] │  [msg2, msg5] │  [msg3, msg6] │        │
└─────────────────────────────────────────────────────────┘
        │               │               │
        ▼               ▼               ▼
   Consumer 1      Consumer 2      Consumer 3
   (instance-1)    (instance-2)    (instance-3)
```

### Key Rules

1. **Max Parallelism = Number of Partitions**
   - If you have 3 partitions, you can have at most 3 active consumers in a group
   - Extra consumers will be idle

2. **Message Ordering**
   - Messages within a partition are strictly ordered
   - Messages across partitions have no ordering guarantee

3. **Partition Key**
   - Messages with the same key always go to the same partition
   - We use `orderId` as the key to ensure all events for an order go to the same partition

---

## Consumer Groups & Load Balancing

### How Consumer Groups Work

Each service uses a unique consumer group ID. Kafka automatically balances partitions among consumers in the same group.

```
                         orders topic (6 partitions)
                    ┌───┬───┬───┬───┬───┬───┐
                    │ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │
                    └───┴───┴───┴───┴───┴───┘
                      │   │   │   │   │   │
        ┌─────────────┼───┼───┼───┼───┼───┼─────────────┐
        │             │   │   │   │   │   │             │
        ▼             ▼   ▼   ▼   ▼   ▼   ▼             ▼
┌───────────────┐  ┌─────────────────────────┐  ┌───────────────┐
│ payment-group │  │    inventory-group      │  │ shipping-group│
│               │  │                         │  │               │
│ ┌───────────┐ │  │ ┌───────┐ ┌───────┐    │  │ ┌───────────┐ │
│ │Payment #1 │ │  │ │Inv #1 │ │Inv #2 │    │  │ │Shipping #1│ │
│ │ P0,P1,P2  │ │  │ │P0,P1,P2│ │P3,P4,P5│   │  │ │ P0-P5     │ │
│ └───────────┘ │  │ └───────┘ └───────┘    │  │ └───────────┘ │
│ ┌───────────┐ │  │                         │  │               │
│ │Payment #2 │ │  │                         │  │               │
│ │ P3,P4,P5  │ │  │                         │  │               │
│ └───────────┘ │  │                         │  │               │
└───────────────┘  └─────────────────────────┘  └───────────────┘
   2 instances         2 instances                 1 instance
```

### Current Consumer Groups

| Service | Consumer Group ID | Subscribes To |
|---------|-------------------|---------------|
| Payment Service | `payment-service-group` | `orders` |
| Inventory Service | `inventory-service-group` | `orders` |
| Shipping Service | `shipping-service-group` | `payments`, `inventory` |
| Analytics Service | `analytics-service-group` | `orders`, `payments`, `inventory`, `shipping` |

---

## Scaling Strategy

### Recommended Partition Count

```
Partitions = max(expected_throughput / throughput_per_consumer, number_of_replicas)
```

**For this application:**

| Topic | Recommended Partitions | Reason |
|-------|------------------------|--------|
| `orders` | 6-12 | High volume, multiple consumers |
| `payments` | 3-6 | Medium volume |
| `inventory` | 3-6 | Medium volume |
| `shipping` | 3-6 | Medium volume |
| `orders-replay` | 3 | Batch processing, less critical |

### Scaling Each Service

| Service | Can Scale? | Max Useful Replicas | Notes |
|---------|------------|---------------------|-------|
| API Gateway | Yes | Unlimited | Stateless, use load balancer |
| Payment Service | Yes | = orders partitions | Each replica handles subset of partitions |
| Inventory Service | Yes | = orders partitions | Requires DB transaction handling |
| Shipping Service | Yes | = max(payments, inventory partitions) | Stateful (tracks order readiness) |
| Analytics Service | Yes | = total partitions across all topics | Aggregates all events |

---

## Configuring Kafka Partitions

### Option 1: Create Topics with Kafka CLI

```bash
# Connect to Kafka container
docker exec -it kafka bash

# Create topics with specific partition count
kafka-topics --create --topic orders --bootstrap-server localhost:9092 --partitions 6 --replication-factor 1
kafka-topics --create --topic payments --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics --create --topic inventory --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics --create --topic shipping --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics --create --topic orders-replay --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1

# Verify topics
kafka-topics --list --bootstrap-server localhost:9092

# Describe topic details
kafka-topics --describe --topic orders --bootstrap-server localhost:9092
```

### Option 2: Alter Existing Topics

```bash
# Increase partitions (cannot decrease!)
kafka-topics --alter --topic orders --bootstrap-server localhost:9092 --partitions 6
```

### Option 3: Create Script

Create `scripts/create-topics.sh`:

```bash
#!/bin/bash

KAFKA_CONTAINER="kafka"
BOOTSTRAP_SERVER="localhost:9092"

topics=(
  "orders:6"
  "payments:3"
  "inventory:3"
  "shipping:3"
  "orders-replay:3"
)

for topic_config in "${topics[@]}"; do
  IFS=':' read -r topic partitions <<< "$topic_config"

  echo "Creating topic: $topic with $partitions partitions"

  docker exec $KAFKA_CONTAINER kafka-topics \
    --create \
    --if-not-exists \
    --topic $topic \
    --bootstrap-server $BOOTSTRAP_SERVER \
    --partitions $partitions \
    --replication-factor 1
done

echo "Topics created successfully!"
docker exec $KAFKA_CONTAINER kafka-topics --list --bootstrap-server $BOOTSTRAP_SERVER
```

---

## Running Multiple Service Replicas

### Method 1: Different Ports (Development)

Run multiple instances on different ports:

```bash
# Terminal 1 - Payment Service Instance 1
PORT=4001 node services/payment-service/src/index.js

# Terminal 2 - Payment Service Instance 2
PORT=4011 node services/payment-service/src/index.js

# Terminal 3 - Payment Service Instance 3
PORT=4021 node services/payment-service/src/index.js
```

### Method 2: Using Environment Variables

Create instance-specific configs:

```bash
# payment-instance-1.env
PORT=4001
KAFKA_CLIENT_ID=payment-service-1
INSTANCE_ID=1

# payment-instance-2.env
PORT=4011
KAFKA_CLIENT_ID=payment-service-2
INSTANCE_ID=2
```

Run with:
```bash
env $(cat payment-instance-1.env | xargs) node services/payment-service/src/index.js
```

---

## Docker Compose Scaling

### Updated docker-compose.yml for Scaling

Create `docker-compose.scale.yml`:

```yaml
services:
  # Infrastructure (same as before)
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_NUM_PARTITIONS: 6  # Default partitions for auto-created topics

  postgres:
    image: postgres:15-alpine
    container_name: postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ecommerce
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql

  # API Gateway with load balancer
  api-gateway:
    build: ./services/api-gateway
    environment:
      - KAFKA_BROKERS=kafka:29092
      - DB_HOST=postgres
    depends_on:
      - kafka
      - postgres
    deploy:
      replicas: 3
    # No fixed ports - use nginx for load balancing

  # Nginx Load Balancer for API Gateway
  nginx:
    image: nginx:alpine
    ports:
      - "4000:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api-gateway

  # Payment Service (scalable)
  payment-service:
    build: ./services/payment-service
    environment:
      - KAFKA_BROKERS=kafka:29092
      - DB_HOST=postgres
    depends_on:
      - kafka
      - postgres
    deploy:
      replicas: 3

  # Inventory Service (scalable)
  inventory-service:
    build: ./services/inventory-service
    environment:
      - KAFKA_BROKERS=kafka:29092
      - DB_HOST=postgres
    depends_on:
      - kafka
      - postgres
    deploy:
      replicas: 2

  # Shipping Service (scalable)
  shipping-service:
    build: ./services/shipping-service
    environment:
      - KAFKA_BROKERS=kafka:29092
      - DB_HOST=postgres
    depends_on:
      - kafka
      - postgres
    deploy:
      replicas: 2

  # Analytics Service (scalable)
  analytics-service:
    build: ./services/analytics-service
    environment:
      - KAFKA_BROKERS=kafka:29092
      - DB_HOST=postgres
    depends_on:
      - kafka
      - postgres
    ports:
      - "4004:4004"  # WebSocket needs sticky sessions or single instance
    deploy:
      replicas: 1  # Keep 1 for WebSocket simplicity, or use Redis pub/sub

volumes:
  postgres_data:
```

### Nginx Configuration for API Gateway

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream api_gateway {
        least_conn;  # Load balancing algorithm
        server api-gateway:4000;
        # Docker Compose will resolve to all replicas
    }

    server {
        listen 80;

        location / {
            proxy_pass http://api_gateway;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### Scale Commands

```bash
# Start with scaling
docker-compose -f docker-compose.scale.yml up -d

# Scale specific service
docker-compose -f docker-compose.scale.yml up -d --scale payment-service=5

# Check running instances
docker-compose -f docker-compose.scale.yml ps
```

---

## Kubernetes Deployment

### Payment Service Deployment

Create `k8s/payment-service.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
  labels:
    app: payment-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payment-service
  template:
    metadata:
      labels:
        app: payment-service
    spec:
      containers:
        - name: payment-service
          image: ecommerce/payment-service:latest
          ports:
            - containerPort: 4001
          env:
            - name: KAFKA_BROKERS
              value: "kafka-broker:9092"
            - name: DB_HOST
              value: "postgres-service"
            - name: DB_NAME
              value: "ecommerce"
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: username
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: password
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 4001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 4001
            initialDelaySeconds: 5
            periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: payment-service
spec:
  selector:
    app: payment-service
  ports:
    - port: 4001
      targetPort: 4001
  type: ClusterIP

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: payment-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: payment-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### API Gateway with Ingress

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
        - name: api-gateway
          image: ecommerce/api-gateway:latest
          ports:
            - containerPort: 4000
          env:
            - name: KAFKA_BROKERS
              value: "kafka-broker:9092"
            - name: DB_HOST
              value: "postgres-service"

---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
spec:
  selector:
    app: api-gateway
  ports:
    - port: 4000
      targetPort: 4000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-gateway-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: api.ecommerce.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-gateway
                port:
                  number: 4000
```

---

## API Gateway Load Balancing

For the stateless API Gateway, use these load balancing strategies:

### Strategy 1: Round Robin (Default)

Requests are distributed evenly across all instances.

```nginx
upstream api_gateway {
    server api-gateway-1:4000;
    server api-gateway-2:4000;
    server api-gateway-3:4000;
}
```

### Strategy 2: Least Connections

Send to the instance with fewest active connections.

```nginx
upstream api_gateway {
    least_conn;
    server api-gateway-1:4000;
    server api-gateway-2:4000;
    server api-gateway-3:4000;
}
```

### Strategy 3: IP Hash (Sticky Sessions)

Same client always goes to the same instance.

```nginx
upstream api_gateway {
    ip_hash;
    server api-gateway-1:4000;
    server api-gateway-2:4000;
    server api-gateway-3:4000;
}
```

---

## Database Considerations

### Connection Pooling

When running multiple replicas, manage database connections carefully:

```javascript
// In each service's db configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ecommerce',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',

  // Connection pool settings
  max: 5,                    // Max connections per instance
  min: 1,                    // Min connections per instance
  idleTimeoutMillis: 30000,  // Close idle connections after 30s
  connectionTimeoutMillis: 5000,
});
```

**Total connections formula:**
```
Total DB Connections = replicas × max_pool_size

Example: 3 Payment replicas × 5 connections = 15 connections
```

### Using PgBouncer (Recommended for Production)

```yaml
# docker-compose addition
pgbouncer:
  image: edoburu/pgbouncer:latest
  environment:
    DATABASE_URL: postgres://postgres:postgres@postgres:5432/ecommerce
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 1000
    DEFAULT_POOL_SIZE: 20
  ports:
    - "6432:6432"
```

Services connect to PgBouncer instead of PostgreSQL directly.

---

## Monitoring & Metrics

### Kafka Consumer Lag

Monitor consumer lag to detect if consumers can't keep up:

```bash
# Check consumer group lag
docker exec kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --describe \
  --group payment-service-group
```

Output:
```
GROUP                  TOPIC     PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
payment-service-group  orders    0          1000            1005            5
payment-service-group  orders    1          998             1002            4
payment-service-group  orders    2          1001            1001            0
```

### Key Metrics to Monitor

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Consumer Lag | Messages behind | > 1000 |
| Processing Time | Time per message | > 5s |
| Error Rate | Failed messages | > 1% |
| Partition Balance | Even distribution | Variance > 20% |
| DB Connections | Active connections | > 80% of max |

### Prometheus Metrics (Optional Enhancement)

Add to each service:

```javascript
const prometheus = require('prom-client');

// Create metrics
const messagesProcessed = new prometheus.Counter({
  name: 'kafka_messages_processed_total',
  help: 'Total messages processed',
  labelNames: ['topic', 'status']
});

const processingDuration = new prometheus.Histogram({
  name: 'kafka_message_processing_seconds',
  help: 'Message processing duration',
  labelNames: ['topic'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

---

## Quick Reference

### Scaling Checklist

- [ ] Create Kafka topics with appropriate partition count
- [ ] Ensure consumer group IDs are consistent across replicas
- [ ] Configure connection pooling for databases
- [ ] Set up load balancer for API Gateway
- [ ] Implement health checks in all services
- [ ] Monitor consumer lag
- [ ] Test failover scenarios

### Commands

```bash
# Check Kafka topics and partitions
docker exec kafka kafka-topics --describe --bootstrap-server localhost:9092

# Check consumer groups
docker exec kafka kafka-consumer-groups --list --bootstrap-server localhost:9092

# Check consumer lag
docker exec kafka kafka-consumer-groups --describe --group payment-service-group --bootstrap-server localhost:9092

# Scale with Docker Compose
docker-compose up -d --scale payment-service=3

# View logs for specific service
docker-compose logs -f payment-service
```

### Partition Count Guidelines

| Orders/Day | orders Partitions | Consumer Replicas |
|------------|-------------------|-------------------|
| < 10,000 | 3 | 1-2 |
| 10,000 - 100,000 | 6 | 2-4 |
| 100,000 - 1M | 12 | 4-8 |
| > 1M | 24+ | 8+ |

---

## Summary

1. **Partitions = Parallelism** - More partitions allow more consumers
2. **Same Consumer Group = Load Balanced** - Kafka auto-distributes partitions
3. **Different Consumer Groups = Broadcast** - Each group gets all messages
4. **Stateless Services Scale Easily** - API Gateway, Payment, Inventory
5. **Stateful Services Need Care** - Shipping (order readiness tracking), Analytics (WebSocket)
6. **Monitor Consumer Lag** - Key indicator of scaling needs
