# E-Tech Store Backend API

Backend API สำหรับ E-Tech Store ที่พร้อมสำหรับการ deploy บน Vercel

## 🚀 Features

- **Authentication & Authorization** - JWT-based auth
- **Product Management** - CRUD operations
- **Shopping Cart** - Persistent cart functionality
- **Order Management** - Complete order system
- **Admin Dashboard** - Admin functions
- **Vercel Ready** - Optimized for serverless deployment

## 📁 Project Structure

```
Bnodejs/
├── api/                    # Vercel API routes (JavaScript)
│   ├── index.js           # Main API entry point
│   ├── auth.js            # Authentication routes
│   ├── products.js        # Product management
│   ├── cart.js            # Shopping cart
│   ├── orders.js          # Order management
│   └── admin.js           # Admin routes
├── src/                   # TypeScript source code
│   ├── config/            # Database configuration
│   ├── middleware/        # Custom middleware
│   ├── routes/            # API routes (TypeScript)
│   └── server.ts          # Main server file
├── database/              # Database schema
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies
```

## 🔧 Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript + JavaScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT
- **Deployment**: Vercel

## 🚀 Quick Deploy

### 1. Deploy via Vercel Dashboard
1. ไปที่ [vercel.com](https://vercel.com)
2. Import GitHub repository: `tiw25999/BDnode`
3. ตั้งค่า Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `JWT_SECRET`
   - `NODE_ENV=production`
4. Deploy!

### 2. Deploy via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
vercel --prod
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/products/categories` - Get categories

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove cart item

### Orders
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get single order

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/products` - Admin products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `NODE_ENV` | Environment | Yes |
| `JWT_EXPIRE` | JWT expiration time | No |
| `FRONTEND_URL` | Frontend URL for CORS | No |

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📊 Database

ใช้ Supabase (PostgreSQL) ด้วย tables หลัก:
- `users` - User accounts
- `products` - Product catalog
- `cart_items` - Shopping cart
- `orders` - Order records
- `order_items` - Order line items

## 🔒 Security

- JWT Authentication
- Password Hashing (bcrypt)
- CORS Protection
- Input Validation
- Helmet Security Headers

## 📱 Frontend Integration

Backend ทำงานร่วมกับ frontend:
- Frontend: `https://f-dreact.vercel.app`
- API Base: `https://your-backend.vercel.app/api`

## 📞 Support

- GitHub: [tiw25999/BDnode](https://github.com/tiw25999/BDnode)
- Email: suntonrapot.khunchit@gmail.com

---

**สร้างโดย E-Tech Team** สำหรับ Vercel deployment
