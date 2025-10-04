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

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (
          id,
          name,
          price,
          image_url,
          stock_quantity
        )
      `)
      .eq('user_id', req.userId);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch cart' });
    }

    res.json({ cartItems: cartItems || [] });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, stock_quantity')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', req.userId)
      .eq('product_id', productId)
      .single();

    if (existingItem) {
      // Update quantity
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ 
          quantity: existingItem.quantity + quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id);

      if (updateError) {
        console.error('Supabase error:', updateError);
        return res.status(500).json({ error: 'Failed to update cart' });
      }
    } else {
      // Add new item
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert([{
          user_id: req.userId,
          product_id: productId,
          quantity,
          created_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('Supabase error:', insertError);
        return res.status(500).json({ error: 'Failed to add to cart' });
      }
    }

    res.json({ message: 'Item added to cart successfully' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/cart/:id
// @desc    Update cart item quantity
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ 
        quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to update cart item' });
    }

    res.json({ message: 'Cart item updated successfully' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/cart/:id
// @desc    Remove item from cart
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to remove cart item' });
    }

    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/cart
// @desc    Clear entire cart
// @access  Private
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', req.userId);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to clear cart' });
    }

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
