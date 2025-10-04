import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// Mock data storage - use a global variable to persist data across tests
let mockData: any = {
  users: new Map(),
  products: new Map(),
  categories: new Map(),
  brands: new Map(),
  cart_items: new Map(),
  orders: new Map(),
  order_items: new Map(),
  user_addresses: new Map()
};

// Helper function to resolve nested relationships
const resolveRelationships = (data: any[], table: string, selectColumns?: string) => {
  return data.map(record => {
    const resolved = { ...record };
    
    // Handle products relationships
    if (table === 'cart_items' && record.product_id) {
      const product = mockData.products?.get(record.product_id);
      if (product) {
        resolved.products = {
          ...product,
          categories: mockData.categories?.get(product.category_id) || { name: 'Unknown' },
          brands: mockData.brands?.get(product.brand_id) || { name: 'Unknown' }
        };
      }
    }
    
    // Handle order items relationships
    if (table === 'order_items' && record.product_id) {
      const product = mockData.products?.get(record.product_id);
      if (product) {
        resolved.products = {
          ...product,
          categories: mockData.categories?.get(product.category_id) || { name: 'Unknown' },
          brands: mockData.brands?.get(product.brand_id) || { name: 'Unknown' }
        };
      }
    }
    
    // Handle products with categories and brands
    if (table === 'products') {
      if (record.category_id) {
        resolved.categories = mockData.categories?.get(record.category_id) || { name: 'Unknown' };
      }
      if (record.brand_id) {
        resolved.brands = mockData.brands?.get(record.brand_id) || { name: 'Unknown' };
      }
    }
    
    // Handle orders with order_items
    if (table === 'orders') {
      const orderItems = Array.from(mockData.order_items?.values() || [])
        .filter((item: any) => item.order_id === record.id);
      resolved.order_items = orderItems;
    }
    
    return resolved;
  });
};

// Mock Supabase for testing
export const supabase = {
  from: (table: string) => ({
    select: (columns: string = '*', options: any = {}) => {
      const data = Array.from(mockData[table]?.values() || []);
      
      // Handle count with head option
      if (options.count === 'exact' && options.head === true) {
        return Promise.resolve({ count: data.length, error: null });
      }
      
      // Return chainable object for further methods
      return {
        eq: (column: string, value: any) => {
          const filteredData = data.filter((record: any) => record[column] === value);
          const resolvedData = resolveRelationships(filteredData, table, columns);
          return {
            single: () => {
              const single = resolvedData.length > 0 ? resolvedData[0] : null;
              return Promise.resolve({ data: single, error: null });
            },
            eq: (column2: string, value2: any) => {
              const doubleFilteredData = filteredData.filter((record: any) => record[column2] === value2);
              const resolvedData2 = resolveRelationships(doubleFilteredData, table, columns);
              return {
                single: () => {
                  const single = resolvedData2.length > 0 ? resolvedData2[0] : null;
                  return Promise.resolve({ data: single, error: null });
                },
                then: (callback: any) => {
                  return callback({ data: resolvedData2, error: null });
                }
              };
            },
            order: (column: string, options: any) => {
              const sortedData = [...resolvedData].sort((a: any, b: any) => {
                const aVal = a[column];
                const bVal = b[column];
                if (options.ascending === false) {
                  return bVal > aVal ? 1 : -1;
                }
                return aVal > bVal ? 1 : -1;
              });
              const resolvedSortedData = resolveRelationships(sortedData, table, columns);
              return Promise.resolve({ data: resolvedSortedData, error: null });
            },
            then: (callback: any) => {
              return callback({ data: resolvedData, error: null });
            }
          };
        },
        like: (column: string, pattern: string) => {
          const resolvedData = resolveRelationships(data, table, columns);
          return Promise.resolve({ data: resolvedData, error: null });
        },
        or: (condition: string) => {
          const resolvedData = resolveRelationships(data, table, columns);
          return Promise.resolve({ data: resolvedData, error: null });
        },
        ilike: (column: string, pattern: string) => {
          const resolvedData = resolveRelationships(data, table, columns);
          return Promise.resolve({ data: resolvedData, error: null });
        },
        gte: (column: string, value: any) => {
          const filteredData = data.filter((record: any) => {
            const recordVal = record[column];
            return recordVal >= value;
          });
          const resolvedData = resolveRelationships(filteredData, table, columns);
          return {
            lte: (column2: string, value2: any) => {
              const doubleFilteredData = filteredData.filter((record: any) => {
                const recordVal = record[column2];
                return recordVal <= value2;
              });
              const resolvedData2 = resolveRelationships(doubleFilteredData, table, columns);
              return Promise.resolve({ data: resolvedData2, error: null });
            },
            then: (callback: any) => {
              return callback({ data: resolvedData, error: null });
            }
          };
        },
        lte: (column: string, value: any) => {
          const filteredData = data.filter((record: any) => {
            const recordVal = record[column];
            return recordVal <= value;
          });
          const resolvedData = resolveRelationships(filteredData, table, columns);
          return Promise.resolve({ data: resolvedData, error: null });
        },
        order: (column: string, options: any) => {
          const sortedData = [...data].sort((a: any, b: any) => {
            const aVal = a[column];
            const bVal = b[column];
            if (options.ascending === false) {
              return bVal > aVal ? 1 : -1;
            }
            return aVal > bVal ? 1 : -1;
          });
          const resolvedData = resolveRelationships(sortedData, table, columns);
          return {
            range: (from: number, to: number) => {
              const sliced = sortedData.slice(from, to + 1);
              const resolvedSliced = resolveRelationships(sliced, table, columns);
              return Promise.resolve({ data: resolvedSliced, error: null });
            },
            then: (callback: any) => {
              return callback({ data: resolvedData, error: null });
            }
          };
        },
        range: (from: number, to: number) => {
          const sliced = data.slice(from, to + 1);
          const resolvedData = resolveRelationships(sliced, table);
          return Promise.resolve({ data: resolvedData, error: null });
        },
        then: (callback: any) => {
          const resolvedData = resolveRelationships(data, table, columns);
          return callback({ data: resolvedData, error: null });
        }
      };
    },
    count: (mode: string = 'exact') => {
      const data = Array.from(mockData[table]?.values() || []);
      return Promise.resolve({ count: data.length, error: null });
    },
    insert: (data: any) => {
      // Handle both single object and array of objects
      const dataArray = Array.isArray(data) ? data : [data];
      const insertedData: any[] = [];
      
      if (!mockData[table]) mockData[table] = new Map();
      
      for (const item of dataArray) {
        const id = 'test-id-' + Math.random().toString(36).substring(7);
        const newData = { id, ...item };
        mockData[table].set(id, newData);
        insertedData.push(newData);
      }
      
      return {
        select: (columns: string = '*') => {
          const resolvedData = resolveRelationships(insertedData, table);
          return {
            single: () => {
              return Promise.resolve({ data: resolvedData[0], error: null });
            },
            then: (callback: any) => {
              return callback({ data: resolvedData, error: null });
            }
          };
        },
        then: (callback: any) => {
          const resolvedData = resolveRelationships(insertedData, table);
          return callback({ data: Array.isArray(data) ? resolvedData : resolvedData[0], error: null });
        }
      };
    },
    update: (data: any) => ({
      eq: (column: string, value: any) => {
        // Find and update all matching records
        const tableData = mockData[table];
        if (!tableData) {
          return {
            eq: (column2: string, value2: any) => {
              return {
                select: (columns: string = '*') => {
                  return {
                    single: () => {
                      return Promise.resolve({ 
                        data: null, 
                        error: { code: 'PGRST116', message: 'No rows returned' } 
                      });
                    },
                    then: (callback: any) => {
                      return callback({ data: null, error: null });
                    }
                  };
                },
                then: (callback: any) => {
                  return callback({ data: null, error: null });
                }
              };
            },
            select: (columns: string = '*') => {
              return {
                single: () => {
                  return Promise.resolve({ data: null, error: null });
                },
                then: (callback: any) => {
                  return callback({ data: null, error: null });
                }
              };
            },
            then: (callback: any) => {
              return callback({ data: null, error: null });
            }
          };
        }
        
        // Handle single eq
        let updated = null;
        for (const [key, record] of tableData.entries()) {
          if (record[column] === value) {
            const updatedRecord = { ...record, ...data };
            tableData.set(key, updatedRecord);
            updated = updatedRecord;
          }
        }
        
        return {
          eq: (column2: string, value2: any) => {
            // Double filter for update operations
            let doubleUpdated = null;
            for (const [key, record] of tableData.entries()) {
              if (record[column] === value && record[column2] === value2) {
                const updatedRecord = { ...record, ...data };
                tableData.set(key, updatedRecord);
                doubleUpdated = updatedRecord;
              }
            }
            
            const resolvedData = doubleUpdated ? resolveRelationships([doubleUpdated], table) : [];
            
            return {
              select: (columns: string = '*') => {
                return {
                  single: () => {
                    if (!doubleUpdated) {
                      return Promise.resolve({ 
                        data: null, 
                        error: { code: 'PGRST116', message: 'No rows returned' } 
                      });
                    }
                    return Promise.resolve({ data: resolvedData[0], error: null });
                  },
                  then: (callback: any) => {
                    return callback({ data: resolvedData, error: null });
                  }
                };
              },
              then: (callback: any) => {
                return callback({ data: resolvedData[0] || null, error: null });
              }
            };
          },
          select: (columns: string = '*') => {
            const resolvedData = updated ? resolveRelationships([updated], table) : [];
            return {
              single: () => {
                if (!updated) {
                  return Promise.resolve({ 
                    data: null, 
                    error: { code: 'PGRST116', message: 'No rows returned' } 
                  });
                }
                return Promise.resolve({ data: resolvedData[0], error: null });
              },
              then: (callback: any) => {
                return callback({ data: resolvedData, error: null });
              }
            };
          },
          then: (callback: any) => {
            const resolvedData = updated ? resolveRelationships([updated], table) : [];
            return callback({ data: resolvedData[0] || null, error: null });
          }
        };
      }
    }),
    delete: () => ({
      eq: (column: string, value: any) => {
        // Find and delete all matching records
        const tableData = mockData[table];
        if (!tableData) {
          return {
            eq: (column2: string, value2: any) => {
              return Promise.resolve({ data: null, error: null });
            }
          };
        }
        
        // Handle single eq (for clear cart)
        if (column === 'user_id') {
          const keysToDelete = [];
          for (const [key, record] of tableData.entries()) {
            if (record[column] === value) {
              keysToDelete.push(key);
            }
          }
          keysToDelete.forEach(key => tableData.delete(key));
          return Promise.resolve({ data: null, error: null });
        }
        
        return {
          eq: (column2: string, value2: any) => {
            // Double filter for delete operations
            const doubleFilteredKeys = [];
            for (const [key, record] of tableData.entries()) {
              if (record[column] === value && record[column2] === value2) {
                doubleFilteredKeys.push(key);
              }
            }
            
            if (doubleFilteredKeys.length === 0) {
              return Promise.resolve({ 
                data: null, 
                error: { code: 'PGRST116', message: 'No rows returned' } 
              });
            }
            
            doubleFilteredKeys.forEach(key => tableData.delete(key));
            return Promise.resolve({ data: null, error: null });
          }
        };
      },
      like: (column: string, pattern: string) => {
        mockData[table]?.clear();
        return Promise.resolve({ data: null, error: null });
      }
    })
  })
};

export const cleanupDatabase = async () => {
  try {
    // Clear all mock data
    Object.values(mockData).forEach((map: any) => map.clear());
  } catch (error) {
    console.warn('Database cleanup failed:', error);
  }
};

export const createTestUser = async (userData: any = {}) => {
  const randomId = Math.random().toString(36).substring(7);
  const defaultUser = {
    id: 'test-user-' + randomId,
    email: `test-${randomId}@example.com`,
    password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.5.6.7',
    first_name: 'Test',
    last_name: 'User',
    role: 'user',
    ...userData
  };

  // Store in mock database directly
  if (!mockData.users) mockData.users = new Map();
  mockData.users.set(defaultUser.id, defaultUser);

  return defaultUser;
};

export const createTestAdmin = async (userData: any = {}) => {
  const randomId = Math.random().toString(36).substring(7);
  const defaultAdmin = {
    id: 'test-admin-' + randomId,
    email: `admin-${randomId}@example.com`,
    password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.5.6.7',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    ...userData
  };

  // Store in mock database directly
  if (!mockData.users) mockData.users = new Map();
  mockData.users.set(defaultAdmin.id, defaultAdmin);

  return defaultAdmin;
};

export const createTestProduct = async (productData: any = {}) => {
  const randomId = Math.random().toString(36).substring(7);
  
  // Create category first
  const categoryData = {
    id: 'test-category-' + randomId,
    name: `Test Category ${randomId}`,
    description: 'Test category for testing'
  };
  if (!mockData.categories) mockData.categories = new Map();
  mockData.categories.set(categoryData.id, categoryData);

  // Create brand
  const brandData = {
    id: 'test-brand-' + randomId,
    name: `Test Brand ${randomId}`,
    description: 'Test brand for testing'
  };
  if (!mockData.brands) mockData.brands = new Map();
  mockData.brands.set(brandData.id, brandData);
  
  const defaultProduct = {
    id: 'test-product-' + randomId,
    name: `Test Product ${randomId}`,
    description: 'Test product description',
    price: 100.00,
    stock_quantity: 10,
    category_id: categoryData.id,
    brand_id: brandData.id,
    image_url: 'https://example.com/test-image.jpg',
    rating: 4.5,
    is_new: true,
    is_sale: false,
    ...productData
  };

  // Store in mock database directly
  if (!mockData.products) mockData.products = new Map();
  mockData.products.set(defaultProduct.id, defaultProduct);

  return defaultProduct;
};