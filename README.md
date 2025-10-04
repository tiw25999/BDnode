# E-Tech Store Backend API

Backend API สำหรับ E-Tech Store e-commerce platform ที่ใช้ Node.js, TypeScript, และ PostgreSQL + Supabase

## 🚀 Features

- **Authentication & Authorization** - JWT-based auth with user/admin roles
- **Product Management** - CRUD operations for products, categories, brands
- **Shopping Cart** - Add, update, remove cart items
- **Order Management** - Create orders, track status, order history
- **User Management** - Profile management, address management
- **Admin Dashboard** - Statistics, user management, order management
- **File Upload** - Product images and user avatars
- **Rate Limiting** - API rate limiting for security
- **Input Validation** - Request validation using express-validator

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL + Supabase
- **Authentication**: JWT
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **File Upload**: Multer

## 📋 Prerequisites

- Node.js (v18+)
- npm หรือ yarn
- Supabase account
- Git

## 🚀 Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd Bnodejs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp env.example .env
   ```
   
   แก้ไขไฟล์ `.env`:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d

   # File Upload
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5242880

   # CORS
   FRONTEND_URL=http://localhost:3000

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Setup Supabase Database**
   - สร้าง project ใหม่ใน [Supabase](https://supabase.com)
   - ไปที่ SQL Editor และรันไฟล์ `database/schema.sql`
   - Copy URL และ API keys ไปใส่ใน `.env`

5. **Run the application**
   ```bash
   # Development
   npm run dev

   # Production
   npm run build
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/profile` | Update user profile | Private |

### Product Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/products` | Get all products | Public |
| GET | `/api/products/:id` | Get single product | Public |
| POST | `/api/products` | Create product | Admin |
| PUT | `/api/products/:id` | Update product | Admin |
| DELETE | `/api/products/:id` | Delete product | Admin |
| GET | `/api/products/categories` | Get categories | Public |
| GET | `/api/products/brands` | Get brands | Public |

### Cart Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/cart` | Get cart items | Private |
| POST | `/api/cart` | Add item to cart | Private |
| PUT | `/api/cart/:id` | Update cart item | Private |
| DELETE | `/api/cart/:id` | Remove cart item | Private |
| DELETE | `/api/cart` | Clear cart | Private |

### Order Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/orders` | Get user orders | Private |
| GET | `/api/orders/:id` | Get single order | Private |
| POST | `/api/orders` | Create order | Private |
| PUT | `/api/orders/:id/status` | Update order status | Private/Admin |

### User Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/users/addresses` | Get user addresses | Private |
| POST | `/api/users/addresses` | Add address | Private |
| PUT | `/api/users/addresses/:id` | Update address | Private |
| DELETE | `/api/users/addresses/:id` | Delete address | Private |
| PUT | `/api/users/avatar` | Update avatar | Private |

### Admin Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/admin/dashboard` | Get dashboard stats | Admin |
| GET | `/api/admin/users` | Get all users | Admin |
| GET | `/api/admin/orders` | Get all orders | Admin |
| GET | `/api/admin/orders/:id` | Get order details | Admin |
| PUT | `/api/admin/orders/:id/status` | Update order status | Admin |
| GET | `/api/admin/reports/sales` | Get sales report | Admin |

## 🔐 Authentication

API ใช้ JWT tokens สำหรับ authentication:

1. **Register/Login** เพื่อรับ token
2. **Include token** ใน Authorization header:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

## 📊 Database Schema

### Tables
- `users` - User accounts
- `user_addresses` - User shipping addresses
- `products` - Product catalog
- `categories` - Product categories
- `brands` - Product brands
- `cart_items` - Shopping cart items
- `orders` - Order information
- `order_items` - Order line items

### Key Features
- **UUID Primary Keys** - All tables use UUID
- **Row Level Security** - Supabase RLS policies
- **Timestamps** - Auto-updating created_at/updated_at
- **Foreign Key Constraints** - Data integrity
- **Indexes** - Optimized queries

## 🚀 Deployment

### Supabase Setup
1. สร้าง project ใน [Supabase](https://supabase.com)
2. รัน SQL schema ใน SQL Editor
3. ตั้งค่า RLS policies
4. Copy connection details

### Environment Variables
```env
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secure-jwt-secret
FRONTEND_URL=https://your-frontend-domain.com
```

### Deployment Platforms
- **Railway** - Easy deployment
- **Render** - Free tier available
- **Heroku** - Popular choice
- **Vercel** - Serverless functions
- **DigitalOcean** - VPS deployment

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📝 API Examples

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Get Products
```bash
curl -X GET "http://localhost:5000/api/products?page=1&limit=10&category=มือถือ"
```

### Add to Cart
```bash
curl -X POST http://localhost:5000/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "productId": "product-uuid",
    "quantity": 2
  }'
```

## 🔧 Development

### Project Structure
```
src/
├── config/          # Database configuration
├── middleware/      # Custom middleware
├── routes/          # API routes
├── server.ts        # Main server file
└── types/           # TypeScript types
```

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

หากมีปัญหาหรือคำถาม:
- สร้าง Issue ใน GitHub
- ติดต่อ: suntonrapot.khunchit@gmail.com

---

Made with ❤️ by E-Tech Team
