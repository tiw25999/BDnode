const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to authenticate admin
const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only');
    
    // Check if user is admin
    supabase
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single()
      .then(({ data: user, error }) => {
        if (error || !user || user.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }
        req.userId = decoded.userId;
        next();
      });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private (Admin)
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get total products
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Get total orders
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // Get total revenue
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'delivered');

    const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0;

    // Get recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total_amount,
        created_at,
        users (
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      stats: {
        totalUsers: totalUsers || 0,
        totalProducts: totalProducts || 0,
        totalOrders: totalOrders || 0,
        totalRevenue
      },
      recentOrders: recentOrders || []
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/products
// @desc    Get all products for admin
// @access  Private (Admin)
router.get('/products', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;
    
    let query = supabase
      .from('products')
      .select('*');

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

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
    console.error('Get admin products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/products
// @desc    Create new product
// @access  Private (Admin)
router.post('/products', authenticateAdmin, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      category, 
      stockQuantity, 
      imageUrl 
    } = req.body;

    if (!name || !description || !price || !category || !stockQuantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert([{
        name,
        description,
        price: parseFloat(price),
        category,
        stock_quantity: parseInt(stockQuantity),
        image_url: imageUrl || null,
        is_active: true,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to create product' });
    }

    res.status(201).json({ 
      message: 'Product created successfully',
      product 
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/products/:id
// @desc    Update product
// @access  Private (Admin)
router.put('/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to update product' });
    }

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/products/:id
// @desc    Delete product
// @access  Private (Admin)
router.delete('/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to delete product' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/orders
// @desc    Get all orders for admin
// @access  Private (Admin)
router.get('/orders', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        users (
          first_name,
          last_name,
          email
        )
      `);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    res.json({
      orders: orders || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private (Admin)
router.put('/orders/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to update order status' });
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
