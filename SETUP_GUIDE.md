# 🚀 E-Tech Store Backend Setup Guide

คู่มือการตั้งค่า Backend สำหรับ E-Tech Store

## 📋 Prerequisites

- Node.js (v18+)
- npm หรือ yarn
- Supabase account

## 🔧 Quick Setup

### 1. Install Dependencies
```bash
cd Bnodejs
npm install
```

### 2. Setup Environment Variables
```bash
npm run setup
```

### 3. Configure Supabase

#### 3.1 สร้าง Supabase Project
1. ไปที่ [https://supabase.com](https://supabase.com)
2. สร้าง project ใหม่
3. เลือก region ที่ใกล้ที่สุด (Singapore)
4. รอให้ project สร้างเสร็จ

#### 3.2 ตั้งค่า Database
1. ไปที่ **SQL Editor** ใน Supabase Dashboard
2. Copy โค้ดจากไฟล์ `database/schema.sql`
3. Paste และรันใน SQL Editor
4. รอให้สร้าง tables เสร็จ

#### 3.3 รับ API Keys
1. ไปที่ **Settings** > **API**
2. Copy **Project URL** และ **anon public** key
3. แก้ไขไฟล์ `.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Seed Database
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```

## ✅ Verification

หาก setup สำเร็จ คุณจะเห็น:

```
✅ MongoDB connected successfully
🚀 Server running on port 5000
📱 Frontend URL: http://localhost:3000
🌍 Environment: development
```

## 🧪 Test API

เปิด browser ไปที่: `http://localhost:5000/health`

ควรเห็น:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## 📊 Sample Data

หลังจากรัน `npm run seed` จะมีข้อมูลตัวอย่าง:

### Sample Accounts:
- **Admin**: `admin@etech.com` / `admin123`
- **User**: `user@etech.com` / `user123`

### Sample Products:
- iPhone 15 Pro (฿42,900)
- MacBook Air M2 (฿35,900)
- Samsung Galaxy S24 (฿32,900)
- และอีก 9 รายการ

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/login` - เข้าสู่ระบบ
- `GET /api/auth/me` - ดูข้อมูลผู้ใช้

### Products
- `GET /api/products` - ดูสินค้าทั้งหมด
- `GET /api/products/:id` - ดูสินค้ารายการเดียว
- `POST /api/products` - เพิ่มสินค้า (Admin)
- `PUT /api/products/:id` - แก้ไขสินค้า (Admin)
- `DELETE /api/products/:id` - ลบสินค้า (Admin)

### Cart
- `GET /api/cart` - ดูตะกร้าสินค้า
- `POST /api/cart` - เพิ่มสินค้าลงตะกร้า
- `PUT /api/cart/:id` - แก้ไขจำนวนสินค้า
- `DELETE /api/cart/:id` - ลบสินค้าจากตะกร้า

### Orders
- `GET /api/orders` - ดูคำสั่งซื้อ
- `POST /api/orders` - สร้างคำสั่งซื้อ
- `GET /api/orders/:id` - ดูรายละเอียดคำสั่งซื้อ

## 🐛 Troubleshooting

### Error: Missing Supabase environment variables
**Solution**: ตรวจสอบไฟล์ `.env` และให้แน่ใจว่าใส่ SUPABASE_URL และ SUPABASE_ANON_KEY ถูกต้อง

### Error: Database connection failed
**Solution**: 
1. ตรวจสอบ Supabase project ว่า active อยู่
2. ตรวจสอบ API keys ว่าถูกต้อง
3. ตรวจสอบ network connection

### Error: Table doesn't exist
**Solution**: รัน SQL schema ใน Supabase SQL Editor อีกครั้ง

### Error: Permission denied
**Solution**: ตรวจสอบ RLS policies ใน Supabase (ตอนนี้ปิดไว้เพื่อให้ API ใช้งานได้)

## 📝 Next Steps

1. **Connect Frontend**: ตามคู่มือใน `FRONTEND_INTEGRATION.md`
2. **Enable RLS**: เมื่อพร้อมแล้ว สามารถเปิด RLS policies ได้
3. **Deploy**: Deploy ไปยัง production server

## 🆘 Support

หากมีปัญหา:
1. ตรวจสอบ console logs
2. ดู Supabase Dashboard logs
3. ตรวจสอบ network tab ใน browser dev tools

---

**Happy Coding! 🎉**
