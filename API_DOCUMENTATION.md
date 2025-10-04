# E-Tech Store API Documentation

Complete API documentation for the E-Tech Store Backend API.

## Base URL

```
Production: https://etech-backend.onrender.com/api
Development: http://localhost:5001/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "token": "jwt-token"
  }
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "token": "jwt-token"
  }
}
```

#### GET /auth/me
Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "avatarUrl": "https://...",
      "addresses": [...],
      "defaultAddressIndex": 0,
      "role": "user"
    }
  }
}
```

#### PUT /auth/profile
Update user profile.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "avatarUrl": "https://...",
  "addresses": [...],
  "defaultAddressIndex": 0
}
```

### Products

#### GET /products
Get all products with optional filtering.

**Query Parameters:**
- `category` (string): Filter by category
- `brand` (string): Filter by brand
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `sort` (string): Sort by 'new', 'low', 'high', 'best'
- `search` (string): Search term
- `page` (number): Page number
- `limit` (number): Items per page

**Example:**
```
GET /products?category=Mobile&brand=Apple&minPrice=100&maxPrice=1000&sort=low&search=iphone&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "iPhone 15 Pro",
        "description": "Latest iPhone model",
        "price": 999.99,
        "category": "Mobile",
        "brand": "Apple",
        "imageUrl": "https://...",
        "stockQuantity": 50,
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

#### GET /products/:id
Get product by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "uuid",
      "name": "iPhone 15 Pro",
      "description": "Latest iPhone model",
      "price": 999.99,
      "category": "Mobile",
      "brand": "Apple",
      "imageUrl": "https://...",
      "stockQuantity": 50,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### GET /products/categories
Get all categories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Mobile",
      "description": "Mobile phones and accessories"
    },
    {
      "id": "uuid",
      "name": "Laptop",
      "description": "Laptops and notebooks"
    }
  ]
}
```

#### GET /products/brands
Get all brands.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Apple",
      "description": "Apple Inc."
    },
    {
      "id": "uuid",
      "name": "Samsung",
      "description": "Samsung Electronics"
    }
  ]
}
```

### Cart

#### GET /cart
Get user's cart.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "product": {
          "id": "uuid",
          "name": "iPhone 15 Pro",
          "price": 999.99,
          "imageUrl": "https://..."
        },
        "quantity": 2,
        "subtotal": 1999.98
      }
    ],
    "total": 1999.98,
    "itemCount": 2
  }
}
```

#### POST /cart/add
Add item to cart.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "uuid",
  "quantity": 2
}
```

#### PUT /cart/update/:itemId
Update cart item quantity.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "quantity": 3
}
```

#### DELETE /cart/remove/:itemId
Remove item from cart.

**Headers:**
```
Authorization: Bearer <token>
```

#### DELETE /cart/clear
Clear entire cart.

**Headers:**
```
Authorization: Bearer <token>
```

### Orders

#### POST /orders
Create new order.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "addressLine": "123 Main St",
    "subDistrict": "Downtown",
    "district": "City",
    "province": "State",
    "postalCode": "12345",
    "phone": "+1234567890"
  },
  "paymentMethod": "Credit Card"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid",
      "userId": "uuid",
      "status": "pending",
      "totalAmount": 1999.98,
      "shippingAddress": {...},
      "paymentMethod": "Credit Card",
      "items": [...],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### GET /orders
Get user's orders.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (string): Filter by status
- `page` (number): Page number
- `limit` (number): Items per page

#### GET /orders/:id
Get order by ID.

**Headers:**
```
Authorization: Bearer <token>
```

### Admin

#### GET /admin/users
Get all users (Admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

#### GET /admin/orders
Get all orders (Admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

#### PUT /admin/orders/:id/status
Update order status (Admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "shipped"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 500 | Internal Server Error |

## Rate Limiting

- 100 requests per 15 minutes per IP
- Headers included in response:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## CORS

- Allowed origins: `https://etech-frontend.onrender.com`, `http://localhost:3000`
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS
- Allowed headers: Content-Type, Authorization

## Health Check

#### GET /health
Check API health status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 3600
}
```
