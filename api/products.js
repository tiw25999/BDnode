const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
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
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
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
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    res.json({
      products: products || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/products/categories
// @desc    Get product categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('products')
      .select('category')
      .eq('is_active', true);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    // Get unique categories
    const uniqueCategories = [...new Set(categories.map(item => item.category))];
    
    res.json({ categories: uniqueCategories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
