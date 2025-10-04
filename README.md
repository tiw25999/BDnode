# E-Tech Store Backend API

A robust, scalable backend API for the E-Tech Store e-commerce platform built with Node.js, Express.js, TypeScript, and Supabase.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Product Management**: CRUD operations for products, categories, and brands
- **Shopping Cart**: Session-based cart management
- **Order Processing**: Complete order lifecycle management
- **Admin Dashboard**: Comprehensive admin panel for store management
- **File Upload**: Image upload and management
- **Database**: PostgreSQL with Supabase
- **Security**: CORS, rate limiting, input validation, and security headers

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database (Supabase recommended)
- Git

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tiw25999/BDnode.git
   cd BDnode
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Fill in your environment variables in `.env`:
   ```env
   PORT=5001
   NODE_ENV=development
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5242880
   FRONTEND_URL=http://localhost:3000
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Database Setup**
   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql`
   - Update your `.env` with Supabase credentials

5. **Seed Database (Optional)**
   ```bash
   npm run seed
   ```

## 🚀 Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

The API will be available at `http://localhost:5001`

## 📚 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

### Product Endpoints

#### Get All Products
```http
GET /api/products
```

#### Get Product by ID
```http
GET /api/products/:id
```

#### Get Categories
```http
GET /api/products/categories
```

#### Get Brands
```http
GET /api/products/brands
```

### Cart Endpoints

#### Get Cart
```http
GET /api/cart
Authorization: Bearer <token>
```

#### Add to Cart
```http
POST /api/cart/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product-id",
  "quantity": 2
}
```

#### Update Cart Item
```http
PUT /api/cart/update/:itemId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### Remove from Cart
```http
DELETE /api/cart/remove/:itemId
Authorization: Bearer <token>
```

### Order Endpoints

#### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "product-id",
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

#### Get User Orders
```http
GET /api/orders
Authorization: Bearer <token>
```

#### Get Order by ID
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

### Admin Endpoints

#### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <admin-token>
```

#### Get All Orders
```http
GET /api/admin/orders
Authorization: Bearer <admin-token>
```

#### Update Order Status
```http
PUT /api/admin/orders/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "shipped"
}
```

## 🗄️ Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password_hash` (VARCHAR)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `phone` (VARCHAR)
- `avatar_url` (TEXT)
- `addresses` (JSONB)
- `default_address_index` (INTEGER)
- `role` (VARCHAR, Default: 'user')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Products Table
- `id` (UUID, Primary Key)
- `name` (VARCHAR)
- `description` (TEXT)
- `price` (DECIMAL)
- `category_id` (UUID, Foreign Key)
- `brand_id` (UUID, Foreign Key)
- `image_url` (TEXT)
- `stock_quantity` (INTEGER)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Orders Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `status` (VARCHAR)
- `total_amount` (DECIMAL)
- `shipping_address` (JSONB)
- `payment_method` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5001 |
| `NODE_ENV` | Environment | development |
| `SUPABASE_URL` | Supabase project URL | - |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | - |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRE` | JWT expiration | 7d |
| `UPLOAD_PATH` | File upload path | ./uploads |
| `MAX_FILE_SIZE` | Max file size in bytes | 5242880 |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📦 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run seed` - Seed database with sample data
- `npm run setup` - Setup development environment

## 🚀 Deployment

### Render (Recommended)

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy!

### Other Platforms

The application can be deployed to any Node.js hosting platform:
- Heroku
- Vercel
- Railway
- DigitalOcean App Platform

## 🔒 Security Features

- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Comprehensive request validation
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Security Headers**: Helmet.js for security headers
- **File Upload Security**: Validated file uploads

## 📊 Monitoring

- Health check endpoint: `GET /health`
- Request logging
- Error tracking
- Performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@etech.com or create an issue in the repository.

## 🔗 Links

- [Frontend Repository](https://github.com/tiw25999/FDreact)
- [Live Demo](https://etech-store.onrender.com)
- [API Documentation](https://etech-backend.onrender.com/api/docs)

---

**E-Tech Store Backend API** - Built with ❤️ by the E-Tech Team