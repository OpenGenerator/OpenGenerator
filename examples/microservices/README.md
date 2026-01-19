# Microservices Example

A complete microservices architecture example demonstrating service decomposition with OpenGenerator.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                            │
│                    (Port 3000)                              │
└──────────────┬──────────────┬──────────────┬───────────────┘
               │              │              │
    ┌──────────▼──┐   ┌───────▼───┐   ┌──────▼──────┐
    │   User      │   │  Product  │   │    Order    │
    │  Service    │   │  Service  │   │   Service   │
    │  (3001)     │   │  (3002)   │   │   (3003)    │
    └──────┬──────┘   └─────┬─────┘   └──────┬──────┘
           │                │                │
           └────────────────┼────────────────┘
                           │
              ┌────────────▼────────────┐
              │        PostgreSQL       │
              │    (Separate DBs)       │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │          Redis          │
              │    (Caching & PubSub)   │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │        RabbitMQ         │
              │    (Async Messaging)    │
              └─────────────────────────┘
```

## Services

| Service | Port | Responsibility |
|---------|------|----------------|
| Gateway | 3000 | Routing, auth, rate limiting |
| User | 3001 | Authentication, user management |
| Product | 3002 | Product catalog, inventory |
| Order | 3003 | Orders, cart, checkout |
| Notification | 3004 | Email, push notifications |

## Quick Start

### Using Docker

```bash
# Start all services
pnpm docker:up

# View logs
docker-compose logs -f

# Stop services
pnpm docker:down
```

### Local Development

```bash
# Install dependencies
pnpm install

# Start all services in dev mode
pnpm dev

# Or start individual services
cd services/user && pnpm dev
cd services/product && pnpm dev
```

## API Routes

### Gateway Routes

| Route | Service | Description |
|-------|---------|-------------|
| `/api/auth/*` | User | Authentication |
| `/api/users/*` | User | User management |
| `/api/products/*` | Product | Product catalog |
| `/api/categories/*` | Product | Categories |
| `/api/orders/*` | Order | Order management |
| `/api/cart/*` | Order | Shopping cart |

### Service-to-Service Communication

Services communicate via:
1. **Synchronous HTTP** - Direct REST calls for real-time data
2. **Async Messaging** - RabbitMQ for event-driven workflows
3. **Redis PubSub** - Real-time updates and caching

## Message Queue Events

| Event | Publisher | Consumers |
|-------|-----------|-----------|
| `user.created` | User | Notification |
| `user.updated` | User | Order |
| `order.created` | Order | Notification, Product |
| `order.paid` | Order | Notification, Product |
| `inventory.low` | Product | Notification |

## Database Design

Each service has its own database:

- `users` - User Service database
- `products` - Product Service database
- `orders` - Order Service database

This ensures loose coupling and independent scaling.

## Deployment

### Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/

# Check pods
kubectl get pods -n microservices
```

### Docker Swarm

```bash
docker stack deploy -c docker-compose.yml microservices
```

## Monitoring

The example includes:
- Health checks at `/health`
- Aggregated health at gateway `/health/services`
- Ready for Prometheus metrics
- Structured JSON logging

## Learn More

- [Microservices Guide](https://opengenerator.dev/guides/microservices)
- [Service Discovery](https://opengenerator.dev/guides/service-discovery)
- [Event-Driven Architecture](https://opengenerator.dev/guides/events)
