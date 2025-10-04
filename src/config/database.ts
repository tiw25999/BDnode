import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Mock Supabase for testing
let supabase: any;
let supabaseAdmin: any;

if (process.env.NODE_ENV === 'test') {
  // Import mock data from test helpers
  const { supabase: mockSupabase } = require('../../tests/helpers/database');
  supabase = mockSupabase;
  supabaseAdmin = mockSupabase;
} else {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Client for all operations (uses anon key) with performance optimizations
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'e-tech-store@1.0.0',
      },
    },
  });

  // Alias for admin operations (same as regular client)
  supabaseAdmin = supabase;
}

export { supabase, supabaseAdmin };

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          avatar_url: string | null;
          role: 'user' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          category_id: string | null;
          brand_id: string | null;
          rating: number;
          is_new: boolean;
          is_sale: boolean;
          stock_quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          category_id?: string | null;
          brand_id?: string | null;
          rating?: number;
          is_new?: boolean;
          is_sale?: boolean;
          stock_quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          category_id?: string | null;
          brand_id?: string | null;
          rating?: number;
          is_new?: boolean;
          is_sale?: boolean;
          stock_quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          quantity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          order_number: string;
          status: 'Pending' | 'Paid' | 'Shipped' | 'Completed' | 'Cancelled';
          subtotal: number;
          vat: number;
          shipping: number;
          grand_total: number;
          payment_method: 'Bank' | 'QR PromptPay' | 'Credit Card';
          shipping_address: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_number: string;
          status?: 'Pending' | 'Paid' | 'Shipped' | 'Completed' | 'Cancelled';
          subtotal: number;
          vat: number;
          shipping: number;
          grand_total: number;
          payment_method: 'Bank' | 'QR PromptPay' | 'Credit Card';
          shipping_address: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_number?: string;
          status?: 'Pending' | 'Paid' | 'Shipped' | 'Completed' | 'Cancelled';
          subtotal?: number;
          vat?: number;
          shipping?: number;
          grand_total?: number;
          payment_method?: 'Bank' | 'QR PromptPay' | 'Credit Card';
          shipping_address?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          product_price: number;
          quantity: number;
          total_price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          product_price: number;
          quantity: number;
          total_price: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          product_price?: number;
          quantity?: number;
          total_price?: number;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      brands: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      user_addresses: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          address_line: string;
          sub_district: string;
          district: string;
          province: string;
          postal_code: string;
          phone: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          address_line: string;
          sub_district: string;
          district: string;
          province: string;
          postal_code: string;
          phone: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          address_line?: string;
          sub_district?: string;
          district?: string;
          province?: string;
          postal_code?: string;
          phone?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
