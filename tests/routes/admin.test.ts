import request from 'supertest';
import express from 'express';
import adminRoutes from '../../src/routes/admin';
import authRoutes from '../../src/routes/auth';
import cartRoutes from '../../src/routes/cart';
import ordersRoutes from '../../src/routes/orders';
import { cleanupDatabase, createTestUser, createTestAdmin, createTestProduct } from '../helpers/database';
import { errorHandler } from '../../src/middleware/errorHandler';
import { notFound } from '../../src/middleware/notFound';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);
app.use(notFound);
app.use(errorHandler);

describe('Admin Routes', () => {
  let adminToken: string;
  let userToken: string;
  let adminUserId: string;
  let regularUserId: string;
  let orderId: string;

  beforeEach(async () => {
    await cleanupDatabase();

    // Create admin user
    const adminUser = await createTestAdmin({
      email: 'admin@example.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.5.6.7'
    });
    adminUserId = adminUser.id;

    // Create regular user
    const regularUser = await createTestUser({
      email: 'user@example.com',
      role: 'user',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.5.6.7'
    });
    regularUserId = regularUser.id;

    // For mock authentication, use the user IDs directly as tokens
    adminToken = adminUser.id;
    userToken = regularUser.id;
  });

  describe('GET /api/admin/dashboard', () => {
    beforeEach(async () => {
      // Create some test data
      await createTestProduct({ name: 'Admin Test Product 1', price: 100, stock_quantity: 10 });
      await createTestProduct({ name: 'Admin Test Product 2', price: 200, stock_quantity: 5 });
    });

    it('should get dashboard statistics successfully', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalUsers).toBeDefined();
      expect(response.body.data.stats.totalProducts).toBeDefined();
      expect(response.body.data.stats.totalOrders).toBeDefined();
      expect(response.body.data.stats.totalRevenue).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });
  });

  describe('GET /api/admin/users', () => {
    beforeEach(async () => {
      // Create additional admin users for testing
      await createTestAdmin({ email: 'admin2@example.com' });
      await createTestAdmin({ email: 'admin3@example.com' });
    });

    it('should get users list with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ role: 'admin' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      // All returned users should be admins
      response.body.data.forEach((user: any) => {
        expect(user.role).toBe('admin');
      });
    });

    it('should search users by email', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'admin@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].email).toBe('admin@example.com');
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: -1, limit: 0 })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });
  });

  describe('GET /api/admin/orders', () => {
    beforeEach(async () => {
      // Create some test orders
      const product = await createTestProduct({
        name: 'Test Product',
        price: 100,
        stock_quantity: 10
      });

      // Add to cart and create order
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: product.id,
          quantity: 2
        });

      const orderData = {
        items: [
          {
            productId: product.id,
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
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData);

      console.log('Order creation response:', orderResponse.body);
      
      if (orderResponse.body.data) {
        orderId = orderResponse.body.data.id;
      }
    });

    it('should get orders list with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'Pending' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      // All returned orders should have Pending status
      response.body.data.forEach((order: any) => {
        expect(order.status).toBe('Pending');
      });
    });

    it('should filter orders by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ startDate: today, endDate: today })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });
  });

  describe('GET /api/admin/orders/:id', () => {
    let orderId: string;

    beforeEach(async () => {
      // Create a test order
      const product = await createTestProduct({
        name: 'Admin Order Test Product',
        price: 100,
        stock_quantity: 10
      });

      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: product.id,
          quantity: 2
        });

      const orderData = {
        items: [
          {
            productId: product.id,
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
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData);

      orderId = orderResponse.body.data.id;
    });

    it('should get order details successfully', async () => {
      const response = await request(app)
        .get(`/api/admin/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(orderId);
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/admin/orders/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toBe('Order not found');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get(`/api/admin/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });
  });

  describe('PUT /api/admin/orders/:id/status', () => {
    let orderId: string;

    beforeEach(async () => {
      // Create a test order
      const product = await createTestProduct({
        name: 'Admin Order Test Product',
        price: 100,
        stock_quantity: 10
      });

      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: product.id,
          quantity: 2
        });

      const orderData = {
        items: [
          {
            productId: product.id,
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
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData);

      orderId = orderResponse.body.data.id;
    });

    it('should update order status successfully', async () => {
      const response = await request(app)
        .put(`/api/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'Paid' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Paid');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .put(`/api/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'InvalidStatus' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .put('/api/admin/orders/999999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'Paid' })
        .expect(404);

      expect(response.body.error).toBe('Order not found');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .put(`/api/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .query({ status: 'Paid' })
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });
  });

  describe('GET /api/admin/reports/sales', () => {
    beforeEach(async () => {
      // Create some test orders for sales report
      const product = await createTestProduct({
        name: 'Test Product',
        price: 100,
        stock_quantity: 10
      });

      // Create multiple orders
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/cart')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            productId: product.id,
            quantity: 1
          });

        const orderData = {
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

        await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send(orderData);
      }
    });

    it('should get sales report successfully', async () => {
      const response = await request(app)
        .get('/api/admin/reports/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.totalRevenue).toBeDefined();
      expect(response.body.data.summary.totalOrders).toBeDefined();
      expect(response.body.data.dailySales).toBeDefined();
    });

    it('should filter sales report by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get('/api/admin/reports/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ startDate: today, endDate: today })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/admin/reports/sales')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Admin access required');
    });
  });

  describe('Admin Access Control', () => {
    it('should deny access to all admin routes for regular users', async () => {
      const adminRoutes = [
        '/api/admin/dashboard',
        '/api/admin/users',
        '/api/admin/orders',
        '/api/admin/reports/sales'
      ];

      for (const route of adminRoutes) {
        const response = await request(app)
          .get(route)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);

        expect(response.body.error).toBe('Admin access required');
      }
    });

    it('should require authentication for all admin routes', async () => {
      const adminRoutes = [
        '/api/admin/dashboard',
        '/api/admin/users',
        '/api/admin/orders',
        '/api/admin/reports/sales'
      ];

      for (const route of adminRoutes) {
        const response = await request(app)
          .get(route)
          .expect(401);

        expect(response.body.error).toBe('Access token required');
      }
    });
  });
});
