const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🔄 Starting migration: Add product_image_url to order_items...');
    
    // Check if column already exists
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'order_items')
      .eq('column_name', 'product_image_url');
    
    if (columnError) {
      console.error('❌ Error checking columns:', columnError);
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ Column product_image_url already exists');
    } else {
      console.log('📝 Adding product_image_url column...');
      
      // Add the column using raw SQL
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE order_items ADD COLUMN product_image_url TEXT;'
      });
      
      if (alterError) {
        console.error('❌ Error adding column:', alterError);
        return;
      }
      
      console.log('✅ Column added successfully');
    }
    
    // Update existing order_items with image URLs
    console.log('🔄 Updating existing order_items with image URLs...');
    
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE order_items 
        SET product_image_url = products.image_url
        FROM products 
        WHERE order_items.product_id = products.id 
        AND order_items.product_image_url IS NULL;
      `
    });
    
    if (updateError) {
      console.error('❌ Error updating images:', updateError);
      return;
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 All existing order_items now have product_image_url');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();
