# E-Tech Store Backend API

ระบบ API Backend ที่แข็งแกร่งและขยายได้สำหรับแพลตฟอร์ม E-Tech Store ที่สร้างด้วย Node.js, Express.js, TypeScript และ Supabase

## 🚀 ฟีเจอร์

- **การยืนยันตัวตนและสิทธิ์**: ระบบ auth แบบ JWT พร้อมการควบคุมสิทธิ์ตามบทบาท
- **การจัดการสินค้า**: CRUD operations สำหรับสินค้า, หมวดหมู่ และแบรนด์
- **ตะกร้าสินค้า**: การจัดการตะกร้าสินค้าแบบ session
- **การประมวลผลคำสั่งซื้อ**: การจัดการวงจรชีวิตคำสั่งซื้อแบบสมบูรณ์
- **แดชบอร์ดแอดมิน**: แผงควบคุมแอดมินที่ครอบคลุมสำหรับการจัดการร้าน
- **การอัปโหลดไฟล์**: การอัปโหลดและจัดการรูปภาพ
- **ฐานข้อมูล**: PostgreSQL กับ Supabase
- **ความปลอดภัย**: CORS, rate limiting, input validation และ security headers

## 📋 ข้อกำหนดเบื้องต้น

- Node.js (v18 หรือสูงกว่า)
- npm หรือ yarn
- ฐานข้อมูล PostgreSQL (แนะนำ Supabase)
- Git

## 🛠️ การติดตั้ง

1. **Clone repository**
   ```bash
   git clone https://github.com/tiw25999/BDnode.git
   cd BDnode
   ```

2. **ติดตั้ง dependencies**
   ```bash
   npm install
   ```

3. **ตั้งค่า Environment**
   ```bash
   cp env.example .env
   ```
   
   กรอกข้อมูล environment variables ใน `.env`:
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

4. **ตั้งค่าฐานข้อมูล**
   - สร้างโปรเจค Supabase ใหม่
   - รัน SQL schema จาก `database/schema.sql`
   - อัปเดต `.env` ด้วยข้อมูล Supabase

5. **Seed ฐานข้อมูล (ไม่บังคับ)**
   ```bash
   npm run seed
   ```

## 🚀 การรันแอปพลิเคชัน

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

API จะพร้อมใช้งานที่ `http://localhost:5001`

## 📚 เอกสาร API

### Authentication Endpoints

#### ลงทะเบียน
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

#### เข้าสู่ระบบ
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### ดูข้อมูลโปรไฟล์
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### อัปเดตโปรไฟล์
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

#### ดูสินค้าทั้งหมด
```http
GET /api/products
```

#### ดูสินค้าตาม ID
```http
GET /api/products/:id
```

#### ดูหมวดหมู่
```http
GET /api/products/categories
```

#### ดูแบรนด์
```http
GET /api/products/brands
```

### Cart Endpoints

#### ดูตะกร้าสินค้า
```http
GET /api/cart
Authorization: Bearer <token>
```

#### เพิ่มสินค้าลงตะกร้า
```http
POST /api/cart/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product-id",
  "quantity": 2
}
```

#### อัปเดตสินค้าในตะกร้า
```http
PUT /api/cart/update/:itemId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

#### ลบสินค้าจากตะกร้า
```http
DELETE /api/cart/remove/:itemId
Authorization: Bearer <token>
```

### Order Endpoints

#### สร้างคำสั่งซื้อ
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

#### ดูคำสั่งซื้อของผู้ใช้
```http
GET /api/orders
Authorization: Bearer <token>
```

#### ดูคำสั่งซื้อตาม ID
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

### Admin Endpoints

#### ดูผู้ใช้ทั้งหมด
```http
GET /api/admin/users
Authorization: Bearer <admin-token>
```

#### ดูคำสั่งซื้อทั้งหมด
```http
GET /api/admin/orders
Authorization: Bearer <admin-token>
```

#### อัปเดตสถานะคำสั่งซื้อ
```http
PUT /api/admin/orders/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "shipped"
}
```

## 🗄️ โครงสร้างฐานข้อมูล

### ตาราง Users
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

### ตาราง Products
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

### ตาราง Orders
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `status` (VARCHAR)
- `total_amount` (DECIMAL)
- `shipping_address` (JSONB)
- `payment_method` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## 🔧 การกำหนดค่า

### Environment Variables

| ตัวแปร | คำอธิบาย | ค่าเริ่มต้น |
|--------|----------|------------|
| `PORT` | พอร์ตเซิร์ฟเวอร์ | 5001 |
| `NODE_ENV` | Environment | development |
| `SUPABASE_URL` | URL โปรเจค Supabase | - |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | - |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRE` | JWT expiration | 7d |
| `UPLOAD_PATH` | เส้นทางการอัปโหลดไฟล์ | ./uploads |
| `MAX_FILE_SIZE` | ขนาดไฟล์สูงสุด (bytes) | 5242880 |
| `FRONTEND_URL` | URL Frontend สำหรับ CORS | http://localhost:3000 |
| `RATE_LIMIT_WINDOW_MS` | หน้าต่าง rate limit | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | จำนวนคำขอสูงสุดต่อหน้าต่าง | 100 |

## 🧪 การทดสอบ

```bash
# รันการทดสอบ
npm test

# รันการทดสอบพร้อม coverage
npm run test:coverage

# รันการทดสอบแบบ watch mode
npm run test:watch
```

## 📦 Scripts

- `npm run dev` - เริ่มเซิร์ฟเวอร์ development
- `npm run build` - Build สำหรับ production
- `npm start` - เริ่มเซิร์ฟเวอร์ production
- `npm test` - รันการทดสอบ
- `npm run seed` - Seed ฐานข้อมูลด้วยข้อมูลตัวอย่าง
- `npm run setup` - ตั้งค่า environment development

## 🚀 การ Deploy

### Render (แนะนำ)

1. เชื่อมต่อ GitHub repository กับ Render
2. สร้าง Web Service ใหม่
3. ตั้งค่า build command: `npm install && npm run build`
4. ตั้งค่า start command: `npm start`
5. เพิ่ม environment variables
6. Deploy!

### แพลตฟอร์มอื่น

แอปพลิเคชันสามารถ deploy ไปยังแพลตฟอร์ม Node.js hosting ใดก็ได้:
- Heroku
- Vercel
- Railway
- DigitalOcean App Platform

## 🔒 ฟีเจอร์ความปลอดภัย

- **CORS**: การกำหนดค่า cross-origin resource sharing
- **Rate Limiting**: ป้องกันการใช้งาน API มากเกินไป
- **Input Validation**: การตรวจสอบคำขอที่ครอบคลุม
- **JWT Authentication**: การยืนยันตัวตนแบบ token ที่ปลอดภัย
- **Password Hashing**: bcrypt สำหรับความปลอดภัยรหัสผ่าน
- **Security Headers**: Helmet.js สำหรับ security headers
- **File Upload Security**: การอัปโหลดไฟล์ที่ผ่านการตรวจสอบ

## 📊 การตรวจสอบ

- Health check endpoint: `GET /health`
- การบันทึกคำขอ
- การติดตามข้อผิดพลาด
- การตรวจสอบประสิทธิภาพ

## 🤝 การมีส่วนร่วม

1. Fork repository
2. สร้าง feature branch
3. ทำการเปลี่ยนแปลง
4. เพิ่มการทดสอบ
5. ส่ง pull request

## 📄 ใบอนุญาต

โปรเจคนี้ได้รับอนุญาตภายใต้ MIT License - ดูไฟล์ [LICENSE](LICENSE) สำหรับรายละเอียด

## 🆘 การสนับสนุน

สำหรับการสนับสนุน ส่งอีเมลไปที่ support@etech.com หรือสร้าง issue ใน repository

## 🔗 ลิงก์

- [Frontend Repository](https://github.com/tiw25999/FDreact)
- [Live Demo](https://etech-store.onrender.com)
- [API Documentation](https://etech-backend.onrender.com/api/docs)

---

**E-Tech Store Backend API** - สร้างด้วย ❤️ โดยทีม E-Tech
