const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to authenticate user
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price,
          products (
            id,
            name,
            image_url
          )
        )
      `)
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    res.json({ orders: orders || [] });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price,
          products (
            id,
            name,
            image_url,
            description
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      items, 
      shippingAddress, 
      paymentMethod, 
      totalAmount 
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    if (!shippingAddress || !paymentMethod || !totalAmount) {
      return res.status(400).json({ error: 'Shipping address, payment method, and total amount are required' });
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: req.userId,
        status: 'pending',
        total_amount: totalAmount,
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Supabase error:', orderError);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price,
      created_at: new Date().toISOString()
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Supabase error:', itemsError);
      return res.status(500).json({ error: 'Failed to create order items' });
    }

    // Clear user's cart
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', req.userId);

    res.status(201).json({ 
      message: 'Order created successfully',
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.total_amount,
        createdAt: order.created_at
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put('/:id/status', authenticateToken, async (req, res) => {
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
      .eq('id', id)
      .eq('user_id', req.userId);

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
