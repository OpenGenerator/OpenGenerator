# E-commerce API Example

A full-featured e-commerce backend API with Stripe payment integration.

## Features

- Product catalog with categories and variants
- Shopping cart management
- Order processing and tracking
- Stripe payment integration
- User authentication (JWT + OAuth)
- Customer reviews and ratings
- Inventory management
- Coupon/discount system
- Wishlist functionality
- Address management

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Add your database URL, Stripe keys, etc.

# Run database migrations
pnpm db:migrate

# Seed sample data (optional)
pnpm db:seed

# Generate API code
pnpm generate

# Start development server
pnpm dev
```

## Environment Variables

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## API Endpoints

### Products
- `GET /api/v1/products` - List products
- `GET /api/v1/products/:slug` - Get product details
- `GET /api/v1/categories` - List categories
- `GET /api/v1/categories/:slug/products` - Products by category

### Cart
- `GET /api/v1/cart` - Get current cart
- `POST /api/v1/cart/items` - Add item to cart
- `PUT /api/v1/cart/items/:id` - Update cart item
- `DELETE /api/v1/cart/items/:id` - Remove from cart
- `DELETE /api/v1/cart` - Clear cart

### Checkout & Orders
- `POST /api/v1/checkout` - Create checkout session
- `GET /api/v1/orders` - List user orders
- `GET /api/v1/orders/:id` - Get order details
- `POST /api/v1/orders/:id/cancel` - Cancel order

### Payments
- `POST /api/v1/payments/intent` - Create payment intent
- `POST /webhooks/stripe` - Stripe webhook handler

### Reviews
- `GET /api/v1/products/:id/reviews` - Get product reviews
- `POST /api/v1/products/:id/reviews` - Create review
- `PUT /api/v1/reviews/:id` - Update review
- `DELETE /api/v1/reviews/:id` - Delete review

## Stripe Integration

### Checkout Flow

1. Create checkout session with cart items
2. Redirect to Stripe Checkout
3. Handle webhook for payment confirmation
4. Update order status

### Webhooks

Configure your Stripe webhook to send events to `/webhooks/stripe`:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `checkout.session.completed`
- `customer.subscription.updated` (if subscriptions enabled)

## Data Model

```
User
├── Addresses
├── Orders
│   └── OrderItems
├── Reviews
├── Wishlist
└── Cart
    └── CartItems

Product
├── Category
├── Images
├── Variants
│   └── Inventory
├── Reviews
└── Inventory
```

## Learn More

- [Stripe Integration Guide](https://opengenerator.dev/guides/stripe)
- [E-commerce Best Practices](https://opengenerator.dev/guides/ecommerce)
- [Stripe Documentation](https://stripe.com/docs)
