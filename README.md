# Scalable E-Commerce Backend

A backend application for an e-commerce platform built using NestJS, TypeScript, PostgreSQL and Prisma.

The project covers the main backend operations of an e-commerce system such as authentication, products, categories, cart, orders and payments. It also includes admin authorization, validation, Swagger documentation, testing and Docker support.

## Tech Stack

* NestJS
* TypeScript
* PostgreSQL
* Prisma ORM
* JWT
* bcrypt
* Docker
* Swagger
* Jest
* Supertest

## Features

### Authentication

* User registration
* User login
* JWT authentication
* Get logged-in user
* Password hashing using bcrypt
* Customer and Admin roles
* Admin-only routes

### Categories

* Create category
* Get all categories
* Unique category name and slug

### Products

* Create product
* Get all products
* Get product by ID
* Update product
* Delete product
* Search products
* Filter products by category
* Pagination
* Stock management

Product create, update and delete operations require admin access.

Products are not permanently deleted. The `isActive` field is used for soft deletion.

### Cart

* Get user's cart
* Add product to cart
* Update quantity
* Remove product from cart

Each user has one cart.

### Orders

* Create order from cart
* Get user's orders
* Get order by ID
* Cancel order
* Admin can view all orders
* Admin can update order status

Order statuses:

```text
PENDING
CONFIRMED
SHIPPED
DELIVERED
CANCELLED
```

### Payments

The project contains a simulated payment system.

Supported payment methods:

```text
CARD
UPI
NET_BANKING
COD
```

Payment statuses:

```text
PENDING
PAID
FAILED
REFUNDED
```

The payment system is simulated and is not connected to a real payment provider such as Razorpay or Stripe.

---

## Authentication

After successful login, the API returns a JWT access token.

The token is used for protected routes:

```http
Authorization: Bearer <access_token>
```

There are two roles:

* `CUSTOMER`
* `ADMIN`

Admin routes are protected using JWT authentication and an admin guard.

---

## Database

PostgreSQL is used as the database and Prisma is used to interact with it.

Main models:

* User
* Category
* Product
* Cart
* CartItem
* Order
* OrderItem
* Payment

Main relationships:

```text
User
 ├── Cart
 │    └── CartItem
 │         └── Product
 │
 └── Order
      └── OrderItem
           └── Product

Category
 └── Product

Order
 └── Payment
```

The database schema is present in:

```text
prisma/schema.prisma
```

Database migrations are stored in:

```text
prisma/migrations/
```

---

## Project Structure

```text
ecommerce-backend/
│
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   ├── auth/
│   ├── categories/
│   ├── products/
│   ├── cart/
│   ├── orders/
│   ├── payments/
│   ├── prisma/
│   ├── app.module.ts
│   └── main.ts
│
├── test/
│   └── app.e2e-spec.ts
│
├── Dockerfile
├── docker-compose.yml
├── prisma.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

Each major feature is implemented as a separate NestJS module containing controllers and services.

---

## API Endpoints

### Auth

```text
POST /auth/register
POST /auth/login
GET  /auth/me
```

### Categories

```text
GET  /categories
POST /categories
```

### Products

```text
GET    /products
GET    /products/:id
POST   /products
PATCH  /products/:id
DELETE /products/:id
```

### Cart

```text
GET    /cart
POST   /cart/items
PATCH  /cart/items/:id
DELETE /cart/items/:id
```

### Orders

```text
POST  /orders
GET   /orders
GET   /orders/:id
PATCH /orders/:id/cancel
```

Admin:

```text
GET   /orders/admin/all
PATCH /orders/admin/:id/status
```

### Payments

```text
POST /payments/:orderId
GET  /payments
GET  /payments/:paymentId
```

Admin:

```text
GET   /payments/admin/all
PATCH /payments/:paymentId/process
PATCH /payments/:paymentId/fail
PATCH /payments/:paymentId/refund
```

---

## Swagger

Swagger is used for API documentation and testing.

When running the project locally:

```text
http://localhost:3002/api/docs
```

After logging in, the JWT token can be added using the **Authorize** button in Swagger.

---

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/pritiv23/ecommerce-backend.git
cd ecommerce-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env`

Add the database URL and JWT secret:

```env
DATABASE_URL="your-database-url"
JWT_SECRET="your-secret"
PORT=3001
```

The actual `.env` file should not be committed to GitHub.

### 4. Start Docker

```bash
docker compose up -d
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Run migrations

```bash
npx prisma migrate dev
```

### 7. Seed the database

```bash
npx prisma db seed
```

The seed creates an admin user, categories and sample products.

Demo admin credentials:

```text
Email: admin@example.com
Password: Admin@123
```

### 8. Start the server

```bash
npm run start:dev
```

Swagger:

```text
http://localhost:3002/api/docs
```

---

## Testing

Unit tests:

```bash
npm test
```

E2E tests:

```bash
npm run test:e2e
```

Build:

```bash
npm run build
```

The APIs were also tested manually using Swagger and `curl`.

---

## Docker

Start the containers:

```bash
docker compose up -d
```

Stop the containers:

```bash
docker compose down
```

Check running containers:

```bash
docker ps
```

---

## Deployment

The backend has also been deployed on Render.

Backend URL:

```text
https://ecommerce-backend-w7q9.onrender.com
```

Some public endpoints can be tested directly, for example:

```bash
curl https://ecommerce-backend-w7q9.onrender.com/categories
```

```bash
curl https://ecommerce-backend-w7q9.onrender.com/products
```

The production database is PostgreSQL hosted on Render.

---

## Example Flow

A basic customer flow in the application is:

```text
Register
   ↓
Login
   ↓
Get JWT token
   ↓
View products
   ↓
Add product to cart
   ↓
Create order
   ↓
Create payment
   ↓
Process payment
   ↓
Admin updates order status
```

I tested this flow using a customer account and an admin account.

---

## Future Improvements

Some things that can be added later:

* React/Next.js frontend
* Real payment gateway
* Redis caching
* Rate limiting
* Refresh tokens
* Email notifications
* CI/CD using GitHub Actions
* Logging and monitoring

---

## Author

**Priti Verma**

B.Tech, IIT Kanpur

GitHub: https://github.com/pritiv23
