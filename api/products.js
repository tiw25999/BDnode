const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
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
