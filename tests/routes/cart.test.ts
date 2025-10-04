import request from 'supertest';
import express from 'express';
import cartRoutes from '../../src/routes/cart';
import authRoutes from '../../src/routes/auth';
import { cleanupDatabase, createTestUser, createTestProduct } from '../helpers/database';
import { errorHandler } from '../../src/middleware/errorHandler';
import { notFound } from '../../src/middleware/notFound';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use(notFound);
app.use(errorHandler);

describe('Cart Routes', () => {
  let authToken: string;
  let userId: string;
  let productId: string;

  beforeEach(async () => {
    await cleanupDatabase();

    // Create test user
    const user = await createTestUser({
      email: 'test@example.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.5.6.7'
    });
    userId = user.id;

    // Create test product
    const product = await createTestProduct({
      name: 'Cart Test Product',
      price: 100,
      stock_quantity: 10
    });
    productId = product.id;

    // For mock authentication, use the user ID directly as token
    authToken = user.id;
  });

  describe('GET /api/cart', () => {
    it('should get empty cart for new user', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/cart')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('POST /api/cart', () => {
    it('should add item to cart successfully', async () => {
      const cartData = {
        productId: productId,
        quantity: 2
      };

      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData);

      // Check if successful or if there's an error
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.quantity).toBe(2);
        expect(response.body.data.product.id).toBe(productId);
      } else {
        // If there's an error, log it for debugging
        console.log('Cart add error:', response.body);
        expect(response.status).toBe(201);
      }
    });

    it('should update quantity when adding existing item', async () => {
      // First, add item to cart
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productId,
          quantity: 2
        });

      // Add same item again
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productId,
          quantity: 3
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(5); // 2 + 3
    });

    it('should return 400 for insufficient stock', async () => {
      const cartData = {
        productId: productId,
        quantity: 15 // More than available stock (10)
      };

      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData)
        .expect(400);

      expect(response.body.error).toBe('Insufficient stock');
    });

    it('should return 404 for non-existent product', async () => {
      const cartData = {
        productId: '999999',
        quantity: 1
      };

      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData)
        .expect(404);

      expect(response.body.error).toBe('Product not found');
    });

    it('should return 400 for invalid quantity', async () => {
      const cartData = {
        productId: productId,
        quantity: 0 // Invalid quantity
      };

      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const cartData = {
        productId: productId,
        quantity: 1
      };

      const response = await request(app)
        .post('/api/cart')
        .send(cartData)
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('PUT /api/cart/:id', () => {
    let cartItemId: string;

    beforeEach(async () => {
      // Add item to cart first
      const addResponse = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productId,
          quantity: 2
        });

      cartItemId = addResponse.body.data.id;
    });

    it('should update cart item quantity successfully', async () => {
      const updateData = {
        quantity: 5
      };

      const response = await request(app)
        .put(`/api/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(5);
    });

    it('should return 400 for insufficient stock', async () => {
      const updateData = {
        quantity: 15 // More than available stock
      };

      const response = await request(app)
        .put(`/api/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('Insufficient stock');
    });

    it('should return 404 for non-existent cart item', async () => {
      const updateData = {
        quantity: 5
      };

      const response = await request(app)
        .put('/api/cart/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe('Cart item not found');
    });

    it('should return 400 for invalid quantity', async () => {
      const updateData = {
        quantity: -1 // Invalid quantity
      };

      const response = await request(app)
        .put(`/api/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('DELETE /api/cart/:id', () => {
    let cartItemId: string;

    beforeEach(async () => {
      // Add item to cart first
      const addResponse = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productId,
          quantity: 2
        });

      cartItemId = addResponse.body.data.id;
    });

    it('should remove item from cart successfully', async () => {
      const response = await request(app)
        .delete(`/api/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Item removed from cart');
    });

    it('should return 404 for non-existent cart item', async () => {
      const response = await request(app)
        .delete('/api/cart/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Cart item not found');
    });
  });

  describe('DELETE /api/cart', () => {
    beforeEach(async () => {
      // Add multiple items to cart
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productId,
          quantity: 2
        });

      // Create another product and add to cart
      const product2 = await createTestProduct({
        name: 'Product 2',
        price: 200,
        stock_quantity: 5
      });

      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: product2.id,
          quantity: 1
        });
    });

    it('should clear entire cart successfully', async () => {
      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cart cleared');

      // Verify cart is empty
      const getResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.data).toHaveLength(0);
    });
  });

  describe('Cart Integration Tests', () => {
    it('should maintain cart state across multiple operations', async () => {
      // Add item to cart
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productId,
          quantity: 2
        })
        .expect(201);

      // Get cart and verify
      let response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].quantity).toBe(2);

      // Update quantity
      const cartItemId = response.body.data[0].id;
      await request(app)
        .put(`/api/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 5 })
        .expect(200);

      // Get cart again and verify update
      response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data[0].quantity).toBe(5);

      // Remove item
      await request(app)
        .delete(`/api/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify cart is empty
      response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });
  });
});
