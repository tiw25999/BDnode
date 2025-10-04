-- Migration: Add product_image_url to order_items table
-- Run this script to add the missing column to existing order_items table

-- Add product_image_url column to order_items table
ALTER TABLE order_items 
ADD COLUMN product_image_url TEXT;

-- Update existing order_items with image URLs from products table
UPDATE order_items 
SET product_image_url = products.image_url
FROM products 
WHERE order_items.product_id = products.id;

-- Add comment to the column
COMMENT ON COLUMN order_items.product_image_url IS 'Product image URL at the time of order';
