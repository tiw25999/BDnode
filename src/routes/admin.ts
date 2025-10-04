import express from 'express';
import { supabaseAdmin } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', authenticateToken, async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get total products
    const { count: totalProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Get total orders
    const { count: totalOrders } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // Get total revenue
    const { data: revenueData } = await supabaseAdmin
      .from('orders')
      .select('grand_total')
      .eq('status', 'Completed');

    const totalRevenue = revenueData?.reduce((sum: number, order: any) => sum + order.grand_total, 0) || 0;

    // Get pending orders
    const { count: pendingOrders } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending');

    // Get order status counts
    const { data: statusData } = await supabaseAdmin
      .from('orders')
      .select('status');

    const statusCounts = statusData?.reduce((acc: Record<string, number>, order: any) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get top selling products
    const { data: topProducts } = await supabaseAdmin
      .from('order_items')
      .select(`
        product_id,
        product_name,
        quantity,
        product_price,
        products!inner(name, image_url)
      `);

    const productSales = topProducts?.reduce((acc: Record<string, any>, item: any) => {
      const productId = item.product_id;
      if (!acc[productId]) {
        acc[productId] = {
          id: productId,
          name: item.product_name,
          image: item.products?.image_url || '',
          totalSold: 0,
          totalRevenue: 0
        };
      }
      acc[productId].totalSold += item.quantity;
      acc[productId].totalRevenue += item.quantity * item.product_price;
      return acc;
    }, {} as Record<string, any>) || {};

    const topSellingProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.totalSold - a.totalSold)
      .slice(0, 5);

    // Get recent orders
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        grand_total,
        created_at,
        users!inner(first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    return res.json({
      success: true,
      data: {
        totalProducts: totalProducts || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
        pendingOrders: pendingOrders || 0,
        statusCounts,
        topSellingProducts,
        recentOrders: recentOrders?.map((order: any) => ({
          id: order.id,
          orderNumber: order.order_number,
          status: order.status,
          total: order.grand_total,
          customer: `${order.users.first_name} ${order.users.last_name}`,
          email: order.users.email,
          createdAt: order.created_at
        })) || []
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/orders
// @desc    Get all orders for admin
// @access  Private (Admin only)
router.get('/orders', authenticateToken, async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: orders, error } = await supabaseAdmin
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
        users!inner(first_name, last_name, email),
        order_items (
          id,
          product_name,
          product_price,
          product_image_url,
          quantity,
          total_price
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform data to match frontend format
    const transformedOrders = orders?.map((order: any) => ({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      subtotal: order.subtotal,
      vat: order.vat,
      shipping: order.shipping,
      grandTotal: order.grand_total,
      payment: order.payment_method,
      address: order.shipping_address,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      customer: {
        name: `${order.users.first_name} ${order.users.last_name}`,
        email: order.users.email
      },
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
    })) || [];

    return res.json({
      success: true,
      data: transformedOrders
    });
  } catch (error) {
    console.error('Admin orders error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users for admin
// @access  Private (Admin only)
router.get('/users', authenticateToken, async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        avatar_url,
        role,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data: users || []
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/orders/:id
// @desc    Delete an order (Admin only)
// @access  Private (Admin only)
router.delete('/orders/:id', authenticateToken, async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;

    // Delete order (cascade will delete order_items)
    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/users
// @desc    Create a new user (Admin only)
// @access  Private (Admin only)
router.post('/users', authenticateToken, async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { first_name, last_name, email, phone, password, role } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: 'First name, last name, email, and password are required' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const password_hash = await bcrypt.hash(password, 10);

    // Create new user
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        first_name,
        last_name,
        email,
        phone: phone || null,
        password_hash,
        role: role || 'user',
        avatar_url: null
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      data: newUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update a user (Admin only)
// @access  Private (Admin only)
router.put('/users/:id', authenticateToken, async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const { first_name, last_name, email, phone, role } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    // Update user
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({
        first_name,
        last_name,
        email,
        phone: phone || null,
        role: role || 'user'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user (Admin only)
// @access  Private (Admin only)
router.delete('/users/:id', authenticateToken, async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;

    // Check if this is the last admin
    const { data: allUsers } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('role', 'admin');

    const { data: userToDelete } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', id)
      .single();

    if (userToDelete?.role === 'admin' && allUsers?.length <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin user' });
    }

    // Delete user
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/products/:id
// @desc    Delete a product (Admin only)
// @access  Private (Admin only)
router.delete('/products/:id', authenticateToken, async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;

    // First, delete all order_items that reference this product
    const { error: orderItemsError } = await supabaseAdmin
      .from('order_items')
      .delete()
      .eq('product_id', id);

    if (orderItemsError) {
      console.error('Error deleting order_items:', orderItemsError);
      // Continue anyway, as the product might not be in any orders
    }

    // Then delete the product
    const { error: productError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (productError) {
      throw productError;
    }

    return res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/products/:id
// @desc    Update a product (Admin only)
// @access  Private (Admin only)
router.put('/products/:id', authenticateToken, async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { id } = req.params;
    const { name, price, category, brand, description, image, rating, isNew, isSale } = req.body;

    // Validate required fields
    if (!name || !price || !category || !brand) {
      return res.status(400).json({ error: 'Name, price, category, and brand are required' });
    }

    // Get category_id and brand_id from names
    const { data: categoryData, error: categoryError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('name', category)
      .single();

    const { data: brandData, error: brandError } = await supabaseAdmin
      .from('brands')
      .select('id')
      .eq('name', brand)
      .single();

    if (categoryError || brandError) {
      console.error('Category or brand lookup error:', { categoryError, brandError });
      return res.status(400).json({ error: 'Invalid category or brand' });
    }

    if (!categoryData || !brandData) {
      return res.status(400).json({ error: 'Category or brand not found' });
    }

    // Update product
    const { data: updatedProduct, error } = await supabaseAdmin
      .from('products')
      .update({
        name,
        price: Number(price),
        category_id: categoryData.id,
        brand_id: brandData.id,
        description: description || '',
        image_url: image || '',
        rating: Number(rating) || 0,
        is_new: Boolean(isNew),
        is_sale: Boolean(isSale)
      })
      .eq('id', id)
      .select(`
        *,
        categories:category_id(name),
        brands:brand_id(name)
      `)
      .single();

    if (error) {
      throw error;
    }

    // Transform the response to match frontend expectations
    const transformedProduct = {
      ...updatedProduct,
      category: updatedProduct.categories?.name || category,
      brand: updatedProduct.brands?.name || brand
    };

    return res.json({
      success: true,
      data: transformedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
