# Scalable E-Commerce Backend

This is a backend project for an e-commerce application.

I built this project using NestJS, TypeScript, PostgreSQL and Prisma. It
has user authentication, products, categories, cart, orders, payments
and admin operations.

I also added Swagger for API documentation, DTO validation, JWT
authentication, Docker and tests.

## Tech Stack

- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT
- Docker
- Swagger
- Jest
- Supertest

## Features

### Authentication

- User registration
- User login
- JWT authentication
- Get current logged-in user
- Customer and Admin roles

### Categories

- Create category
- Get all categories
- Unique category name and slug

### Products

- Create product
- Get all products
- Get product by ID
- Update product
- Delete product
- Search products
- Filter by category
- Pagination
- Stock management

Product creation, update and delete are available only for admin users.

Product delete is implemented as a soft delete using the `isActive`
field.

### Cart

- Get current user's cart
- Add product to cart
- Update product quantity
- Remove product from cart

Each user has one cart.

### Orders

- Create order from cart
- View own orders
- View a particular order
- Cancel order
- Admin can view all orders
- Admin can update order status

Order statuses:

- PENDING
- CONFIRMED
- SHIPPED
- DELIVERED
- CANCELLED

### Payments

- Create payment
- View own payments
- Admin can view all payments
- Process payment
- Mark payment as failed
- Refund payment

Payment methods:

- CARD
- UPI
- NET_BANKING
- COD

Payment statuses:

- PENDING
- PAID
- FAILED
- REFUNDED

The payment system in this project is simulated. It is not connected to
a real payment gateway such as Razorpay or Stripe.

## Authentication

After login, the API returns a JWT access token.

For protected APIs, the token is sent as:

Authorization: Bearer <access_token>

There are two roles in the application:

- CUSTOMER
- ADMIN

Admin-only APIs are protected using the JWT guard and AdminGuard.

## Database

I used PostgreSQL as the database and Prisma as the ORM.

Main database models:

- User
- Category
- Product
- Cart
- CartItem
- Order
- OrderItem
- Payment

Some important relationships are:

- A user can have one cart.
- A user can have multiple orders.
- A category can have multiple products.
- A cart contains multiple cart items.
- An order contains multiple order items.
- An order can have one payment.

The Prisma schema is in:

prisma/schema.prisma

## Project Structure

The main source code is divided into separate modules.

src/

    auth/
    categories/
    products/
    cart/
    orders/
    payments/
    prisma/

    app.module.ts
    main.ts

Each module contains its controller and service. DTOs are used for
request validation.

## API

Main API routes:

### Auth

    POST /auth/register
    POST /auth/login
    GET  /auth/me

### Categories

    GET  /categories
    POST /categories

### Products

    GET    /products
    GET    /products/:id
    POST   /products
    PATCH  /products/:id
    DELETE /products/:id

### Cart

    GET    /cart
    POST   /cart/items
    PATCH  /cart/items/:id
    DELETE /cart/items/:id

### Orders

    POST  /orders
    GET   /orders
    GET   /orders/:id
    PATCH /orders/:id/cancel

Admin:

    GET   /orders/admin/all
    PATCH /orders/admin/:id/status

### Payments

    POST  /payments/:orderId
    GET   /payments
    GET   /payments/:paymentId

Admin:

    GET   /payments/admin/all
    PATCH /payments/:paymentId/process
    PATCH /payments/:paymentId/fail
    PATCH /payments/:paymentId/refund

## Swagger

Swagger is available when the application is running.

  http://localhost:3002/api/docs

Swagger can be used to view and test the APIs.

For protected APIs, login first and use the returned JWT token with the
Authorize button in Swagger.

## Running the Project

### 1. Install dependencies

    npm install

### 2. Create `.env`

Add the required database and JWT configuration.

Example:

    DATABASE_URL="your-postgresql-database-url"
    JWT_SECRET="your-secret-key"
    PORT=3001

Do not upload the actual `.env` file containing secrets.

### 3. Start Docker

    docker compose up -d

### 4. Generate Prisma Client

    npx prisma generate

### 5. Run migrations

    npx prisma migrate dev

### 6. Start the application

    npm run start:dev

The API will run on:

    http://localhost:3002/api/docs

Swagger:

    http://localhost:3002/api/docs

## Testing

Unit tests are written using Jest.

Run unit tests:

    npm test

Current result:

    28/28 tests passed

E2E tests:

    npm run test:e2e

Current result:

    1/1 test passed

I also manually tested the APIs using Swagger and HTTP requests during
development.

## Docker

The project includes Docker configuration.

Start containers:

    docker compose up -d

Stop containers:

    docker compose down

Check running containers:

    docker ps

## Production Build

Build the project:

    npm run build

Run the production build:

    npm run start:prod

The production build and Docker production container were tested during
development.

## What I worked on

The main things I worked with in this project were:

- REST APIs using NestJS
- JWT authentication
- Role-based authorization
- PostgreSQL database
- Prisma ORM
- Database relationships
- DTO validation
- Error handling
- Docker
- Swagger
- Unit testing
- E2E testing
- Git and GitHub

## Future Improvements

Some things I can add later:

- Deploy the backend online
- Add a React/Next.js frontend
- Integrate a real payment gateway
- Add Redis caching
- Add GitHub Actions CI/CD
- Add application monitoring
