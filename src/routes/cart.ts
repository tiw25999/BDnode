import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase as supabaseAdmin } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/cart
// @desc    Get user's cart items
// @access  Private
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('Getting cart for user:', req.user!.id);
    const { data: cartItems, error } = await supabaseAdmin
      .from('cart_items')
      .select(`
        id,
        quantity,
        created_at,
        products (
          id,
          name,
          price,
          image_url,
          description,
          rating,
          is_new,
          is_sale,
          categories(name),
          brands(name)
        )
      `)
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    console.log('Cart query result:', { cartItems, error });
    if (error) {
      throw error;
    }

    // Transform data to match frontend format
    const transformedItems = cartItems.map((item: any) => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      return {
        id: item.id,
        quantity: item.quantity,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image_url,
          description: product.description,
          category: Array.isArray(product.categories) ? (product.categories as any)[0]?.name || '' : (product.categories as any)?.name || '',
          brand: Array.isArray(product.brands) ? (product.brands as any)[0]?.name || '' : (product.brands as any)?.name || '',
          rating: product.rating,
          isNew: product.is_new,
          isSale: product.is_sale
        }
      };
    });

    return res.json({
      success: true,
      data: transformedItems
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private
router.post('/', [
  authenticateToken,
  body('productId').isString().notEmpty(),
  body('quantity').isInt({ min: 1 })
], async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, quantity } = req.body;

    // Check if product exists
    const { data: products, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, stock_quantity')
      .eq('id', productId);
    
    const product = products && products.length > 0 ? products[0] : null;

    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check stock availability
    if (product.stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Check if item already exists in cart
    const { data: existingItems } = await supabaseAdmin
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', req.user!.id)
      .eq('product_id', productId);
    
    const existingItem = existingItems && existingItems.length > 0 ? existingItems[0] : null;

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      
      // Get product details for stock check
      const { data: productDataArray } = await supabaseAdmin
        .from('products')
        .select('stock_quantity')
        .eq('id', productId);
      
      const productData = productDataArray && productDataArray.length > 0 ? productDataArray[0] : null;
      
      if (productData && productData.stock_quantity < newQuantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }

      const { data: updatedItems, error: updateError } = await supabaseAdmin
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select(`
          id,
          quantity,
          products (
            id,
            name,
            price,
            image_url,
            description,
            rating,
            is_new,
            is_sale,
            categories(name),
            brands(name)
          )
        `);
      
      const updatedItem = updatedItems && updatedItems.length > 0 ? updatedItems[0] : null;

      if (updateError) {
        throw updateError;
      }

      const product = Array.isArray(updatedItem.products) ? updatedItem.products[0] : updatedItem.products;
      return res.status(201).json({
        success: true,
        data: {
          id: updatedItem.id,
          quantity: updatedItem.quantity,
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image_url,
            description: product.description,
            category: (product.categories as any)?.name || '',
            brand: (product.brands as any)?.name || '',
            rating: product.rating,
            isNew: product.is_new,
            isSale: product.is_sale
          }
        }
      });
    } else {
      // Add new item
      const { data: newItems, error: insertError } = await supabaseAdmin
        .from('cart_items')
        .insert({
          user_id: req.user!.id,
          product_id: productId,
          quantity
        })
        .select(`
          id,
          quantity,
          products (
            id,
            name,
            price,
            image_url,
            description,
            rating,
            is_new,
            is_sale,
            categories(name),
            brands(name)
          )
        `);
      
      const newItem = newItems && newItems.length > 0 ? newItems[0] : null;

      if (insertError) {
        throw insertError;
      }

      const product = Array.isArray(newItem.products) ? newItem.products[0] : newItem.products;
      return res.status(201).json({
        success: true,
        data: {
          id: newItem.id,
          quantity: newItem.quantity,
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image_url,
            description: product.description,
            category: (product.categories as any)?.name || '',
            brand: (product.brands as any)?.name || '',
            rating: product.rating,
            isNew: product.is_new,
            isSale: product.is_sale
          }
        }
      });
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/cart/:id
// @desc    Update cart item quantity
// @access  Private
router.put('/:id', [
  authenticateToken,
  body('quantity').isInt({ min: 1 })
], async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { quantity } = req.body;

    // Check if cart item exists and belongs to user
    const { data: cartItems, error: cartError } = await supabaseAdmin
      .from('cart_items')
      .select(`
        id,
        product_id,
        products(stock_quantity)
      `)
      .eq('id', id)
      .eq('user_id', req.user!.id);
    
    const cartItem = cartItems && cartItems.length > 0 ? cartItems[0] : null;

    if (cartError || !cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Check stock availability
    const productData = Array.isArray(cartItem.products) ? cartItem.products[0] : cartItem.products;
    if (productData.stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Update quantity
    const { data: updatedItems, error: updateError } = await supabaseAdmin
      .from('cart_items')
      .update({ quantity })
      .eq('id', id)
      .select(`
        id,
        quantity,
        products (
          id,
          name,
          price,
          image_url,
          description,
          rating,
          is_new,
          is_sale,
          categories(name),
          brands(name)
        )
      `);
    
    const updatedItem = updatedItems && updatedItems.length > 0 ? updatedItems[0] : null;

    if (updateError) {
      throw updateError;
    }

    const productInfo = Array.isArray(updatedItem.products) ? updatedItem.products[0] : updatedItem.products;
    return res.json({
      success: true,
      data: {
        id: updatedItem.id,
        quantity: updatedItem.quantity,
        product: {
          id: productInfo.id,
          name: productInfo.name,
          price: productInfo.price,
          image: productInfo.image_url,
          description: productInfo.description,
          category: Array.isArray(productInfo.categories) ? (productInfo.categories as any)[0]?.name || '' : (productInfo.categories as any)?.name || '',
          brand: Array.isArray(productInfo.brands) ? (productInfo.brands as any)[0]?.name || '' : (productInfo.brands as any)?.name || '',
          rating: productInfo.rating,
          isNew: productInfo.is_new,
          isSale: productInfo.is_sale
        }
      }
    });
  } catch (error) {
    console.error('Update cart error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/cart/:id
// @desc    Remove item from cart
// @access  Private
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // First check if the item exists
    const { data: existingItem } = await supabaseAdmin
      .from('cart_items')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (!existingItem || existingItem.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/cart
// @desc    Clear entire cart
// @access  Private
router.delete('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', req.user!.id);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
