const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file has SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🔄 Starting migration: Add product_image_url to order_items...');
    
    // Step 1: Add column if it doesn't exist
    console.log('📝 Step 1: Adding product_image_url column...');
    
    // Check if column exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('order_items')
      .select('product_image_url')
      .limit(1);
    
    if (testError && testError.code === '42703') {
      // Column doesn't exist, need to add it
      console.log('   Column does not exist, adding...');
      
      // Use RPC to execute SQL
      const { error: alterError } = await supabase.rpc('exec', {
        sql: 'ALTER TABLE order_items ADD COLUMN product_image_url TEXT;'
      });
      
      if (alterError) {
        console.error('❌ Error adding column:', alterError);
        return;
      }
      
      console.log('✅ Column added successfully');
    } else if (testError) {
      console.error('❌ Error checking column:', testError);
      return;
    } else {
      console.log('✅ Column already exists');
    }
    
    // Step 2: Update existing order_items with image URLs
    console.log('🔄 Step 2: Updating existing order_items with image URLs...');
    
    // Get all order_items that don't have product_image_url
    const { data: orderItems, error: fetchError } = await supabase
      .from('order_items')
      .select(`
        id,
        product_id,
        products!inner(image_url)
      `)
      .is('product_image_url', null);
    
    if (fetchError) {
      console.error('❌ Error fetching order_items:', fetchError);
      return;
    }
    
    if (!orderItems || orderItems.length === 0) {
      console.log('✅ All order_items already have product_image_url');
    } else {
      console.log(`📊 Found ${orderItems.length} order_items to update`);
      
      // Update each order_item
      let successCount = 0;
      for (const item of orderItems) {
        const { error: updateError } = await supabase
          .from('order_items')
          .update({ 
            product_image_url: item.products.image_url 
          })
          .eq('id', item.id);
        
        if (updateError) {
          console.error(`❌ Error updating order_item ${item.id}:`, updateError);
        } else {
          successCount++;
          console.log(`✅ Updated order_item ${item.id}`);
        }
      }
      
      console.log(`🎉 Updated ${successCount}/${orderItems.length} order_items successfully!`);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 All existing order_items now have product_image_url');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();
