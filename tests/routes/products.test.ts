import request from 'supertest';
import express from 'express';
import productRoutes from '../../src/routes/products';
import { cleanupDatabase, createTestUser, createTestProduct, createTestAdmin } from '../helpers/database';
import { errorHandler } from '../../src/middleware/errorHandler';
import { notFound } from '../../src/middleware/notFound';

const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);
app.use(notFound);
app.use(errorHandler);

describe('Products Routes', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  describe('GET /api/products', () => {
    let product1Id: string;
    let product2Id: string;
    let product3Id: string;

    beforeEach(async () => {
      // Create test products
      const product1 = await createTestProduct({ name: 'Product 1', price: 100, stock_quantity: 5 });
      const product2 = await createTestProduct({ name: 'Product 2', price: 200, stock_quantity: 10 });
      const product3 = await createTestProduct({ name: 'Product 3', price: 300, stock_quantity: 15 });
      
      product1Id = product1.id;
      product2Id = product2.id;
      product3Id = product3.id;
    });

    it('should get all products with pagination', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: 'Test Category' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
      // All products should have the same category
      response.body.data.forEach((product: any) => {
        expect(product.categories?.name).toContain('Test Category');
      });
    });

    it('should filter products by price range', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ minPrice: 150, maxPrice: 250 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      // Check that all returned products are within price range
      response.body.data.forEach((product: any) => {
        expect(product.price).toBeGreaterThanOrEqual(150);
        expect(product.price).toBeLessThanOrEqual(250);
      });
    });

    it('should search products by name', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ search: 'Product 1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      // Check that all returned products contain the search term
      response.body.data.forEach((product: any) => {
        expect(product.name).toContain('Product 1');
      });
    });

    it('should sort products by price', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ sort: 'price', order: 'asc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      // Check that products are sorted by price in ascending order
      for (let i = 1; i < response.body.data.length; i++) {
        expect(response.body.data[i].price).toBeGreaterThanOrEqual(response.body.data[i-1].price);
      }
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: -1, limit: 0 })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/products/:id', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await createTestProduct({
        name: 'Single Test Product',
        price: 150,
        stock_quantity: 20
      });
      productId = product.id;
    });

    it('should get single product by id', async () => {
      const response = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(productId);
      expect(response.body.data.name).toBe('Single Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/999999')
        .expect(404);

      expect(response.body.error).toBe('Product not found');
    });

    it('should return 404 for invalid product id', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/products (Admin only)', () => {
    let authToken: string;

    beforeEach(async () => {
      const adminUser = await createTestAdmin({
        email: 'admin@example.com',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.5.6.7'
      });

      // Use admin user ID as token for testing
      authToken = adminUser.id;
    });

    it('should create new product with valid data', async () => {
      const productData = {
        name: 'New Product',
        description: 'New product description',
        price: 250,
        stock_quantity: 30,
        image_url: 'https://example.com/new-product.jpg',
        rating: 4.8,
        is_new: true,
        is_sale: false
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(productData.name);
      expect(response.body.data.price).toBe(productData.price);
    });

    it('should return 400 for invalid product data', async () => {
      const productData = {
        name: '', // Invalid: empty name
        price: -100, // Invalid: negative price
        stock_quantity: -5 // Invalid: negative stock
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const productData = {
        name: 'New Product',
        price: 250,
        stock_quantity: 30
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should return 403 for non-admin user', async () => {
      const regularUser = await createTestUser({
        email: 'user@example.com',
        role: 'user',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.5.6.7'
      });

      // For mock authentication, use the user ID directly as token
      const userToken = regularUser.id;

      const productData = {
        name: 'New Product',
        price: 250,
        stock_quantity: 30
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(productData)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });
  });

  describe('PUT /api/products/:id (Admin only)', () => {
    let authToken: string;
    let productId: string;

    beforeEach(async () => {
      const adminUser = await createTestAdmin({
        email: 'admin@example.com',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.5.6.7'
      });

      // Use admin user ID as token for testing
      authToken = adminUser.id;

      const product = await createTestProduct({
        name: 'Original Product',
        price: 100,
        stock_quantity: 10
      });
      productId = product.id;
    });

    it('should update product with valid data', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 150,
        stock_quantity: 20
      };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.price).toBe(updateData.price);
    });

    it('should return 404 for non-existent product', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 150
      };

      const response = await request(app)
        .put('/api/products/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe('Product not found');
    });
  });

  describe('DELETE /api/products/:id (Admin only)', () => {
    let authToken: string;
    let productId: string;

    beforeEach(async () => {
      const adminUser = await createTestAdmin({
        email: 'admin@example.com',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.5.6.7'
      });

      // Use admin user ID as token for testing
      authToken = adminUser.id;

      const product = await createTestProduct({
        name: 'Product to Delete',
        price: 100,
        stock_quantity: 10
      });
      productId = product.id;
    });

    it('should delete product successfully', async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product deleted successfully');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .delete('/api/products/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Product not found');
    });
  });

  describe('GET /api/products/categories', () => {
    it('should get all categories', async () => {
      const response = await request(app)
        .get('/api/products/categories');

      console.log('Categories response:', response.status, response.body);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/products/brands', () => {
    it('should get all brands', async () => {
      const response = await request(app)
        .get('/api/products/brands');

      console.log('Brands response:', response.status, response.body);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});
