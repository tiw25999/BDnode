import request from 'supertest';
import express from 'express';
import ordersRoutes from '../../src/routes/orders';
import authRoutes from '../../src/routes/auth';
import cartRoutes from '../../src/routes/cart';
import { cleanupDatabase, createTestUser, createTestProduct, createTestAdmin } from '../helpers/database';
import { errorHandler } from '../../src/middleware/errorHandler';
import { notFound } from '../../src/middleware/notFound';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use(notFound);
app.use(errorHandler);

describe('Orders Routes', () => {
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
      name: 'Order Test Product',
      price: 100,
      stock_quantity: 10
    });
    productId = product.id;

    // For mock authentication, use the user ID directly as token
    authToken = user.id;
  });

  describe('GET /api/orders', () => {
    it('should get empty orders list for new user', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/orders')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('POST /api/orders', () => {
    beforeEach(async () => {
      // Add items to cart first
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productId,
          quantity: 2
        });
    });

    it('should create order successfully with valid data', async () => {
      const orderData = {
        items: [
          {
            productId: productId,
            quantity: 2
          }
        ],
        subtotal: 200,
        vat: 14,
        shipping: 50,
        paymentMethod: 'Credit Card',
        address: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine: '123 Main St',
          subDistrict: 'Downtown',
          district: 'Central',
          province: 'Bangkok',
          postalCode: '10100',
          phone: '1234567890',
          isDefault: true
        }
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      if (response.status !== 201) {
        console.log('Order creation error:', response.body);
      }
      
      expect(response.status).toBe(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.orderNumber).toBeDefined();
      expect(response.body.data.status).toBe('Pending');
      expect(response.body.data.paymentMethod).toBe(orderData.paymentMethod);
    });

    it('should return 400 for invalid payment method', async () => {
      const orderData = {
        paymentMethod: 'invalid_method',
        address: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine: '123 Main St',
          subDistrict: 'Downtown',
          district: 'Central',
          province: 'Bangkok',
          postalCode: '10100',
          phone: '1234567890',
          isDefault: true
        }
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for missing required address fields', async () => {
      const orderData = {
        // Missing required fields
        paymentMethod: 'Credit Card',
        address: {
          firstName: 'John'
          // Missing other required fields
        }
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for empty cart', async () => {
      // Clear cart first
      await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      const orderData = {
        items: [
          {
            productId: productId,
            quantity: 2
          }
        ],
        subtotal: 200,
        vat: 14,
        shipping: 50,
        paymentMethod: 'Credit Card',
        address: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine: '123 Main St',
          subDistrict: 'Downtown',
          district: 'Central',
          province: 'Bangkok',
          postalCode: '10100',
          phone: '1234567890',
          isDefault: true
        }
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.error).toBe('Cart is empty');
    });

    it('should return 400 for insufficient stock', async () => {
      // Update cart with quantity exceeding stock
      const cartResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      const cartItemId = cartResponse.body.data[0].id;

      await request(app)
        .put(`/api/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 15 }); // More than available stock

      const orderData = {
        items: [
          {
            productId: productId,
            quantity: 20 // More than available stock (10)
          }
        ],
        subtotal: 2000,
        vat: 14,
        shipping: 50,
        paymentMethod: 'Credit Card',
        address: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine: '123 Main St',
          subDistrict: 'Downtown',
          district: 'Central',
          province: 'Bangkok',
          postalCode: '10100',
          phone: '1234567890',
          isDefault: true
        }
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.error).toContain('Insufficient stock');
    });

    it('should return 401 without authentication', async () => {
      const orderData = {
        items: [
          {
            productId: productId,
            quantity: 2
          }
        ],
        subtotal: 200,
        vat: 14,
        shipping: 50,
        paymentMethod: 'Credit Card',
        address: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine: '123 Main St',
          subDistrict: 'Downtown',
          district: 'Central',
          province: 'Bangkok',
          postalCode: '10100',
          phone: '1234567890',
          isDefault: true
        }
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /api/orders/:id', () => {
    let orderId: string;

    beforeEach(async () => {
      // Create an order first
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productId,
          quantity: 2
        });

      const orderData = {
        items: [
          {
            productId: productId,
            quantity: 2
          }
        ],
        subtotal: 200,
        vat: 14,
        shipping: 50,
        paymentMethod: 'Credit Card',
        address: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine: '123 Main St',
          subDistrict: 'Downtown',
          district: 'Central',
          province: 'Bangkok',
          postalCode: '10100',
          phone: '1234567890',
          isDefault: true
        }
      };

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      orderId = orderResponse.body.data.id;
    });

    it('should get order details successfully', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(orderId);
      expect(response.body.data.items).toBeDefined();
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/orders/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Order not found');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('PUT /api/orders/:id/status (Admin only)', () => {
    let adminToken: string;
    let orderId: string;

    beforeEach(async () => {
      // Create admin user
      const adminUser = await createTestAdmin({
        email: 'admin@example.com',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.5.6.7'
      });

      // For mock authentication, use the admin user ID directly as token
      adminToken = adminUser.id;

      // Create an order by admin user
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: productId,
          quantity: 2
        });

      const orderData = {
        items: [
          {
            productId: productId,
            quantity: 2
          }
        ],
        subtotal: 200,
        vat: 14,
        shipping: 50,
        paymentMethod: 'Credit Card',
        address: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine: '123 Main St',
          subDistrict: 'Downtown',
          district: 'Central',
          province: 'Bangkok',
          postalCode: '10100',
          phone: '1234567890',
          isDefault: true
        }
      };

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(orderData);

      orderId = orderResponse.body.data.id;
    });

    it('should update order status successfully', async () => {
      const updateData = {
        status: 'Paid'
      };

      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Paid');
    });

    it('should return 400 for invalid status', async () => {
      const updateData = {
        status: 'InvalidStatus'
      };

      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 404 for non-existent order', async () => {
      const updateData = {
        status: 'Paid'
      };

      const response = await request(app)
        .put('/api/orders/999999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.error).toBe('Order not found');
    });

    it('should return 403 for non-admin user', async () => {
      const updateData = {
        status: 'Paid'
      };

      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${authToken}`) // Regular user token
        .send(updateData)
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('Order Integration Tests', () => {
    it('should complete full order workflow', async () => {
      // 1. Add items to cart
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productId,
          quantity: 2
        })
        .expect(201);

      // 2. Verify cart has items
      let cartResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(cartResponse.body.data).toHaveLength(1);

      // 3. Create order
      const orderData = {
        items: [
          {
            productId: productId,
            quantity: 2
          }
        ],
        subtotal: 200,
        vat: 14,
        shipping: 50,
        paymentMethod: 'Credit Card',
        address: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine: '123 Main St',
          subDistrict: 'Downtown',
          district: 'Central',
          province: 'Bangkok',
          postalCode: '10100',
          phone: '1234567890',
          isDefault: true
        }
      };

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId = orderResponse.body.data.id;

      // 4. Verify cart is cleared after order
      cartResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(cartResponse.body.data).toHaveLength(0);

      // 5. Get order details
      const orderDetailsResponse = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(orderDetailsResponse.body.data.id).toBe(orderId);
      expect(orderDetailsResponse.body.data.status).toBe('Pending');

      // 6. Get user orders
      const ordersResponse = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(ordersResponse.body.data).toHaveLength(1);
      expect(ordersResponse.body.data[0].id).toBe(orderId);
    });
  });
});
