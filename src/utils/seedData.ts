import dotenv from 'dotenv';
import { supabaseAdmin } from '../config/database';

// Load environment variables
dotenv.config();

// Sample data for seeding the database
const sampleCategories = [
  { name: 'มือถือ', description: 'โทรศัพท์มือถือและอุปกรณ์เสริม' },
  { name: 'แล็ปท็อป', description: 'คอมพิวเตอร์แล็ปท็อปและอุปกรณ์' },
  { name: 'อุปกรณ์เสริม', description: 'อุปกรณ์เสริมและอะไหล่' },
  { name: 'หูฟัง', description: 'หูฟังและลำโพง' },
  { name: 'กล้อง', description: 'กล้องถ่ายรูปและอุปกรณ์' }
];

const sampleBrands = [
  { name: 'A-Tech', description: 'แบรนด์เทคโนโลยีชั้นนำ' },
  { name: 'B-Plus', description: 'นวัตกรรมคุณภาพสูง' },
  { name: 'C-Lab', description: 'เทคโนโลยีล้ำสมัย' },
  { name: 'TechPro', description: 'เทคโนโลยีมืออาชีพ' },
  { name: 'SmartGear', description: 'อุปกรณ์อัจฉริยะ' }
];

const sampleProducts = [
  {
    name: 'iPhone 15 Pro',
    description: 'สมาร์ทโฟนรุ่นล่าสุดจาก Apple พร้อมชิป A17 Pro',
    price: 42900,
    image_url: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    is_new: true,
    is_sale: false,
    stock_quantity: 50
  },
  {
    name: 'MacBook Air M2',
    description: 'แล็ปท็อปเบาและทรงพลัง พร้อมชิป M2',
    price: 35900,
    image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=800&auto=format&fit=crop',
    rating: 4.7,
    is_new: true,
    is_sale: true,
    stock_quantity: 30
  },
  {
    name: 'Samsung Galaxy S24',
    description: 'สมาร์ทโฟน Android รุ่นล่าสุด พร้อมกล้อง AI',
    price: 32900,
    image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop',
    rating: 4.6,
    is_new: false,
    is_sale: true,
    stock_quantity: 40
  },
  {
    name: 'AirPods Pro 2',
    description: 'หูฟังไร้สายพร้อม Active Noise Cancellation',
    price: 8900,
    image_url: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?q=80&w=800&auto=format&fit=crop',
    rating: 4.5,
    is_new: false,
    is_sale: false,
    stock_quantity: 100
  },
  {
    name: 'iPad Pro 12.9"',
    description: 'แท็บเล็ตสำหรับงานสร้างสรรค์ พร้อมชิป M2',
    price: 28900,
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=800&auto=format&fit=crop',
    rating: 4.7,
    is_new: true,
    is_sale: false,
    stock_quantity: 25
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'หูฟังไร้สายระดับพรีเมียม พร้อม Noise Cancellation',
    price: 12900,
    image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=800&auto=format&fit=crop',
    rating: 4.6,
    is_new: false,
    is_sale: true,
    stock_quantity: 60
  },
  {
    name: 'Dell XPS 13',
    description: 'แล็ปท็อปพรีเมียม พร้อมหน้าจอ InfinityEdge',
    price: 45900,
    image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800&auto=format&fit=crop',
    rating: 4.4,
    is_new: false,
    is_sale: false,
    stock_quantity: 20
  },
  {
    name: 'Canon EOS R6 Mark II',
    description: 'กล้องมิเรอร์เลสระดับมืออาชีพ พร้อมเซ็นเซอร์ 24MP',
    price: 89900,
    image_url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=800&auto=format&fit=crop',
    rating: 4.8,
    is_new: true,
    is_sale: false,
    stock_quantity: 15
  },
  {
    name: 'Apple Watch Series 9',
    description: 'นาฬิกาอัจฉริยะ พร้อมชิป S9 และ Always-On Display',
    price: 13900,
    image_url: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?q=80&w=800&auto=format&fit=crop',
    rating: 4.5,
    is_new: true,
    is_sale: false,
    stock_quantity: 80
  },
  {
    name: 'Samsung Galaxy Buds2 Pro',
    description: 'หูฟังไร้สายพร้อม Active Noise Cancellation',
    price: 6900,
    image_url: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?q=80&w=800&auto=format&fit=crop',
    rating: 4.3,
    is_new: false,
    is_sale: true,
    stock_quantity: 70
  },
  {
    name: 'Microsoft Surface Laptop 5',
    description: 'แล็ปท็อปพรีเมียม พร้อมหน้าจอ PixelSense',
    price: 38900,
    image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800&auto=format&fit=crop',
    rating: 4.2,
    is_new: false,
    is_sale: false,
    stock_quantity: 35
  },
  {
    name: 'Nintendo Switch OLED',
    description: 'คอนโซลเกมแบบพกพา พร้อมหน้าจอ OLED 7 นิ้ว',
    price: 12900,
    image_url: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=800&auto=format&fit=crop',
    rating: 4.6,
    is_new: false,
    is_sale: true,
    stock_quantity: 45
  }
];

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // 1. Insert categories (with conflict handling)
    console.log('📂 Inserting categories...');
    const { data: existingCategories } = await supabaseAdmin
      .from('categories')
      .select('id, name');

    const existingCategoryNames = existingCategories?.map((c: any) => c.name) || [];
    const newCategories = sampleCategories.filter(cat => !existingCategoryNames.includes(cat.name));

    let categories = existingCategories || [];

    if (newCategories.length > 0) {
      const { data: insertedCategories, error: categoriesError } = await supabaseAdmin
        .from('categories')
        .insert(newCategories)
        .select('id, name');

      if (categoriesError) {
        console.error('Error inserting categories:', categoriesError);
        return;
      }
      categories = [...categories, ...insertedCategories];
    } else {
      console.log('✅ Categories already exist, skipping...');
    }

    // 2. Insert brands (with conflict handling)
    console.log('🏷️ Inserting brands...');
    const { data: existingBrands } = await supabaseAdmin
      .from('brands')
      .select('id, name');

    const existingBrandNames = existingBrands?.map((b: any) => b.name) || [];
    const newBrands = sampleBrands.filter(brand => !existingBrandNames.includes(brand.name));

    let brands = existingBrands || [];

    if (newBrands.length > 0) {
      const { data: insertedBrands, error: brandsError } = await supabaseAdmin
        .from('brands')
        .insert(newBrands)
        .select('id, name');

      if (brandsError) {
        console.error('Error inserting brands:', brandsError);
        return;
      }
      brands = [...brands, ...insertedBrands];
    } else {
      console.log('✅ Brands already exist, skipping...');
    }

    // 3. Insert products with category and brand references (with conflict handling)
    console.log('📱 Inserting products...');
    const { data: existingProducts } = await supabaseAdmin
      .from('products')
      .select('id, name');

    const existingProductNames = existingProducts?.map((p: any) => p.name) || [];
    const newProducts = sampleProducts.filter(product => !existingProductNames.includes(product.name));

    let products = existingProducts || [];

    if (newProducts.length > 0) {
      const productsWithRefs = newProducts.map((product, index) => {
        const categoryIndex = index % categories.length;
        const brandIndex = index % brands.length;
        
        return {
          ...product,
          category_id: categories[categoryIndex].id,
          brand_id: brands[brandIndex].id
        };
      });

      const { data: insertedProducts, error: productsError } = await supabaseAdmin
        .from('products')
        .insert(productsWithRefs)
        .select('id, name');

      if (productsError) {
        console.error('Error inserting products:', productsError);
        return;
      }
      products = [...products, ...insertedProducts];
    } else {
      console.log('✅ Products already exist, skipping...');
    }

    // 4. Create sample admin user (with conflict handling)
    console.log('👤 Creating sample admin user...');
    const bcrypt = require('bcryptjs');
    
    const { data: existingAdmin } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', 'admin@etech.com')
      .single();

    if (!existingAdmin) {
      const adminPassword = await bcrypt.hash('admin123', 12);
      
      const { data: adminUser, error: adminError } = await supabaseAdmin
        .from('users')
        .insert({
          email: 'admin@etech.com',
          password_hash: adminPassword,
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin'
        })
        .select('id, email');

      if (adminError) {
        console.error('Error creating admin user:', adminError);
      } else {
        console.log('✅ Admin user created:', adminUser[0].email);
      }
    } else {
      console.log('✅ Admin user already exists:', existingAdmin.email);
    }

    // 5. Create sample regular user (with conflict handling)
    console.log('👤 Creating sample regular user...');
    
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', 'user@etech.com')
      .single();

    if (!existingUser) {
      const userPassword = await bcrypt.hash('user123', 12);
      
      const { data: regularUser, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          email: 'user@etech.com',
          password_hash: userPassword,
          first_name: 'John',
          last_name: 'Doe',
          role: 'user'
        })
        .select('id, email');

      if (userError) {
        console.error('Error creating regular user:', userError);
      } else {
        console.log('✅ Regular user created:', regularUser[0].email);
      }
    } else {
      console.log('✅ Regular user already exists:', existingUser.email);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample accounts:');
    console.log('Admin: admin@etech.com / admin123');
    console.log('User: user@etech.com / user123');
    console.log(`\n📊 Seeded data:`);
    console.log(`- ${categories.length} categories`);
    console.log(`- ${brands.length} brands`);
    console.log(`- ${products.length} products`);
    console.log('- 2 sample users');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase().then(() => {
    process.exit(0);
  });
}
