const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin && (origin.includes('f-dreact.vercel.app') || origin.includes('localhost'))) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, X-CSRF-Token');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// GET /api/products
app.get('/', async (req, res) => {
  try {
    // Check if Supabase is available
    if (!supabase) {
      console.log('Supabase not available, returning fallback data');
      return res.json({
        success: true,
        data: [
          {
            id: '1',
            name: 'iPhone 15 Pro',
            description: 'Latest iPhone with advanced features',
            price: 39900,
            category: 'มือถือ',
            brand: 'Apple',
            image_url: 'https://via.placeholder.com/300x300?text=iPhone+15+Pro',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Samsung Galaxy S24',
            description: 'Premium Android smartphone',
            price: 29900,
            category: 'มือถือ',
            brand: 'Samsung',
            image_url: 'https://via.placeholder.com/300x300?text=Galaxy+S24',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: '3',
            name: 'MacBook Pro M3',
            description: 'Powerful laptop for professionals',
            price: 59900,
            category: 'คอมพิวเตอร์',
            brand: 'Apple',
            image_url: 'https://via.placeholder.com/300x300?text=MacBook+Pro',
            is_active: true,
            created_at: new Date().toISOString()
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 3,
          totalPages: 1
        }
      });
    }

    const { page = 1, limit = 20, category, search, sort = 'created_at', order = 'desc' } = req.query;
    
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    res.json({
      success: true,
      data: products || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
app.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

module.exports = app;