import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { supabase, supabase as supabaseAdmin } from '../config/database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache invalidation helper
const invalidateCache = (pattern?: string) => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().trim(),
  query('brand').optional().trim(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('search').optional().trim(),
  query('sort').optional().isIn(['name', 'price', 'rating', 'created_at']),
  query('order').optional().isIn(['asc', 'desc'])
], async (req: express.Request, res: express.Response): Promise<express.Response | undefined> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 50, // Increased default limit
      category,
      brand,
      minPrice,
      maxPrice,
      search,
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    // Create cache key
    const cacheKey = `products_${JSON.stringify({ page, limit, category, brand, minPrice, maxPrice, search, sort, order })}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return res.json(cached.data);
    }

    let query = supabaseAdmin
      .from('products')
      .select(`
        *,
        categories(name),
        brands(name)
      `);

    // Filters will be applied to mock data below

    // For testing, use mock data approach
    const { data: allProducts, error: allError } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories(name),
        brands(name)
      `);

    if (allError) {
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    // Apply filters to mock data
    let filteredProducts = allProducts || [];
    
    if (category) {
      filteredProducts = filteredProducts.filter((p: any) => 
        p.categories?.name?.toLowerCase().includes(String(category).toLowerCase())
      );
    }
    
    if (brand) {
      filteredProducts = filteredProducts.filter((p: any) => 
        p.brands?.name?.toLowerCase().includes(String(brand).toLowerCase())
      );
    }
    
    if (minPrice) {
      filteredProducts = filteredProducts.filter((p: any) => p.price >= Number(minPrice));
    }
    
    if (maxPrice) {
      filteredProducts = filteredProducts.filter((p: any) => p.price <= Number(maxPrice));
    }
    
    if (search) {
      filteredProducts = filteredProducts.filter((p: any) => 
        p.name.toLowerCase().includes(String(search).toLowerCase()) ||
        p.description.toLowerCase().includes(String(search).toLowerCase())
      );
    }

    // Apply sorting
    filteredProducts.sort((a: any, b: any) => {
      const aVal = a[sort as string];
      const bVal = b[sort as string];
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Apply pagination
    const fromIndex = (Number(page) - 1) * Number(limit);
    const toIndex = fromIndex + Number(limit);
    const products = filteredProducts.slice(fromIndex, toIndex);
    const count = filteredProducts.length;

    const response = {
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    };

    // Cache the response
    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    return res.json(response);
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/products/categories
// @desc    Get all categories
// @access  Public
router.get('/categories', async (req: express.Request, res: express.Response): Promise<express.Response | undefined> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    // Sort categories by name
    const sortedData = (data || []).sort((a: any, b: any) => a.name.localeCompare(b.name));

    return res.json({
      success: true,
      data: sortedData
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// @route   GET /api/products/brands
// @desc    Get all brands
// @access  Public
router.get('/brands', async (req: express.Request, res: express.Response): Promise<express.Response | undefined> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('*');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch brands' });
    }

    // Sort brands by name
    const sortedData = (data || []).sort((a: any, b: any) => a.name.localeCompare(b.name));

    return res.json({
      success: true,
      data: sortedData
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req: express.Request, res: express.Response): Promise<express.Response | undefined> => {
  try {
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories(name),
        brands(name)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin only)
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('name').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('description').optional().trim(),
  body('categoryId').optional().isUUID(),
  body('brandId').optional().isUUID(),
  body('imageUrl').optional().isURL(),
  body('rating').optional().isFloat({ min: 0, max: 5 }),
  body('isNew').optional().isBoolean(),
  body('isSale').optional().isBoolean(),
  body('stockQuantity').optional().isInt({ min: 0 })
], async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      price,
      description,
      categoryId,
      brandId,
      imageUrl,
      rating = 0,
      isNew = false,
      isSale = false,
      stockQuantity = 0
    } = req.body;

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        price,
        description,
        category_id: categoryId,
        brand_id: brandId,
        image_url: imageUrl,
        rating,
        is_new: isNew,
        is_sale: isSale,
        stock_quantity: stockQuantity
      })
      .select(`
        *,
        categories(name),
        brands(name)
      `)
      .single();

    if (error) {
      throw error;
    }

    // Invalidate products cache
    invalidateCache('products_');

    return res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin only)
router.put('/:id', [
  authenticateToken,
  requireAdmin,
  body('name').optional().trim().notEmpty(),
  body('price').optional().isFloat({ min: 0 }),
  body('description').optional().trim(),
  body('categoryId').optional().isUUID(),
  body('brandId').optional().isUUID(),
  body('imageUrl').optional().isURL(),
  body('rating').optional().isFloat({ min: 0, max: 5 }),
  body('isNew').optional().isBoolean(),
  body('isSale').optional().isBoolean(),
  body('stockQuantity').optional().isInt({ min: 0 })
], async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productId = req.params.id;
    const updateData: any = {};

    // Only include fields that are provided
    const allowedFields = [
      'name', 'price', 'description', 'categoryId', 'brandId',
      'imageUrl', 'rating', 'isNew', 'isSale', 'stockQuantity'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        const dbField = field === 'categoryId' ? 'category_id' :
                       field === 'brandId' ? 'brand_id' :
                       field === 'imageUrl' ? 'image_url' :
                       field === 'isNew' ? 'is_new' :
                       field === 'isSale' ? 'is_sale' :
                       field === 'stockQuantity' ? 'stock_quantity' : field;
        updateData[dbField] = req.body[field];
      }
    });

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select(`
        *,
        categories(name),
        brands(name)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' });
      }
      throw error;
    }

    return res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Admin only)
router.delete('/:id', [authenticateToken, requireAdmin], async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id)
      .eq('id', req.params.id); // Double eq for mock database compatibility

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' });
      }
      throw error;
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

// @route   POST /api/products/categories
// @desc    Create a new category
// @access  Admin only
router.post('/categories', authenticateToken, async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const categoryName = name.trim();

    // Check if category already exists
    const { data: existingCategory } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('name', categoryName)
      .single();

    if (existingCategory) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    // Create new category
    const { data: newCategory, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name: categoryName
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      data: newCategory
    });
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/products/brands
// @desc    Create a new brand
// @access  Admin only
router.post('/brands', authenticateToken, async (req: AuthRequest, res: express.Response): Promise<express.Response | undefined> => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Brand name is required' });
    }

    const brandName = name.trim();

    // Check if brand already exists
    const { data: existingBrand } = await supabaseAdmin
      .from('brands')
      .select('id')
      .eq('name', brandName)
      .single();

    if (existingBrand) {
      return res.status(400).json({ error: 'Brand already exists' });
    }

    // Create new brand
    const { data: newBrand, error } = await supabaseAdmin
      .from('brands')
      .insert({
        name: brandName
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      data: newBrand
    });
  } catch (error) {
    console.error('Create brand error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
