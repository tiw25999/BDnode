import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ET${timestamp}${random}`;
};

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        subtotal,
        vat,
        shipping,
        grand_total,
        payment_method,
        shipping_address,
        created_at,
        updated_at,
        order_items (
          id,
          product_name,
          product_price,
          product_image_url,
          quantity,
          total_price
        )
      `)
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform data to match frontend format
    const transformedOrders = orders.map((order: any) => ({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      subtotal: order.subtotal,
      vat: order.vat,
      shipping: order.shipping,
      grandTotal: order.grand_total,
      paymentMethod: order.payment_method,
      address: order.shipping_address,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: (order.order_items || []).map((item: any) => ({
        id: item.id,
        product: {
          id: item.product_id,
          name: item.product_name,
          price: item.product_price,
          image: item.product_image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'
        },
        quantity: item.quantity,
        totalPrice: item.total_price
      }))
    }));

    return res.json({
      success: true,
      data: transformedOrders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', authenticateToken, async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        subtotal,
        vat,
        shipping,
        grand_total,
        payment_method,
        shipping_address,
        created_at,
        updated_at,
        order_items (
          id,
          product_name,
          product_price,
          product_image_url,
          quantity,
          total_price
        )
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Transform data to match frontend format
    const transformedOrder = {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      subtotal: order.subtotal,
      vat: order.vat,
      shipping: order.shipping,
      grandTotal: order.grand_total,
      paymentMethod: order.payment_method,
      address: order.shipping_address,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: (order.order_items || []).map((item: any) => ({
        id: item.id,
        product: {
          id: item.product_id,
          name: item.product_name,
          price: item.product_price,
          image: item.product_image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'
        },
        quantity: item.quantity,
        totalPrice: item.total_price
      }))
    };

    return res.json({
      success: true,
      data: transformedOrder
    });
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', [
  authenticateToken,
  body('items').isArray({ min: 1 }),
  body('items.*.productId').isString().notEmpty(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('subtotal').isFloat({ min: 0 }),
  body('vat').isFloat({ min: 0 }),
  body('shipping').isFloat({ min: 0 }),
  body('address').isObject(),
  body('address.firstName').notEmpty(),
  body('address.lastName').notEmpty(),
  body('address.addressLine').notEmpty(),
  body('address.subDistrict').notEmpty(),
  body('address.district').notEmpty(),
  body('address.province').notEmpty(),
  body('address.postalCode').notEmpty(),
  body('address.phone').notEmpty(),
  body('paymentMethod').isIn(['Bank', 'QR PromptPay', 'Credit Card'])
], async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Order validation errors:', errors.array());
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { items, subtotal, vat, shipping, address, paymentMethod } = req.body;
    const grandTotal = subtotal + vat + shipping;
    const orderNumber = generateOrderNumber();

    // Check if items array is empty
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    // Check stock availability for each item and collect product data
    const productData = new Map();
    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, stock_quantity, price, image_url')
        .eq('id', item.productId)
        .single();

      if (productError || !product) {
        return res.status(400).json({ error: `Product not found: ${item.productId}` });
      }
      
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}` });
      }

      // Store product data for response
      productData.set(item.productId, {
        name: product.name,
        price: product.price,
        image: product.image_url
      });
    }

    // Start transaction
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: req.user!.id,
        order_number: orderNumber,
        status: 'Pending',
        subtotal,
        vat,
        shipping,
        grand_total: grandTotal,
        payment_method: paymentMethod,
        shipping_address: address
      })
      .select('id')
      .single();

    if (orderError) {
      throw orderError;
    }

    // Create order items
    const orderItems = [];
    for (const item of items) {
      // Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('name, price, stock_quantity')
        .eq('id', item.productId)
        .single();

      if (productError || !product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }

      // Check stock
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${product.name}` 
        });
      }

      const totalPrice = product.price * item.quantity;
      orderItems.push({
        order_id: order.id,
        product_id: item.productId,
        product_name: product.name,
        product_price: product.price,
        product_image_url: product.image_url,
        quantity: item.quantity,
        total_price: totalPrice
      });
    }

    // Insert order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      throw itemsError;
    }

    // Update product stock
    for (const item of items) {
      // First get current stock
      const { data: product, error: getError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.productId)
        .single();

      if (getError) {
        console.error('Get product stock error:', getError);
        continue;
      }

      // Calculate new stock
      const newStock = product.stock_quantity - item.quantity;
      
      // Update stock
      const { error: stockError } = await supabase
        .from('products')
        .update({ 
          stock_quantity: newStock
        })
        .eq('id', item.productId);

      if (stockError) {
        console.error('Stock update error:', stockError);
      }
    }

    // Clear user's cart
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', req.user!.id);

    return res.status(201).json({
      success: true,
      data: {
        id: order.id,
        orderNumber,
        status: 'Pending',
        subtotal,
        vat,
        shipping,
        grandTotal,
        paymentMethod,
        address,
        createdAt: new Date().toISOString(),
        items: items.map((item: any) => {
          const product = productData.get(item.productId);
          return {
            product: {
              id: item.productId,
              name: product?.name || 'Unknown Product',
              price: product?.price || 0,
              image: product?.image || 'https://via.placeholder.com/100x100?text=No+Image'
            },
            quantity: item.quantity
          };
        })
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (for admin)
// @access  Private (Admin only)
router.put('/:id/status', [
  authenticateToken,
  body('status').isIn(['Pending', 'Paid', 'Shipped', 'Completed', 'Cancelled'])
], async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Check if user is admin or order owner
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check permissions
    const isAdmin = req.user!.role === 'admin';
    const isOwner = order.user_id === req.user!.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('id, status, updated_at')
      .single();

    if (updateError) {
      throw updateError;
    }

    return res.json({
      success: true,
      data: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updated_at
      }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
