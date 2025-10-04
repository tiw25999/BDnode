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

async function fixOrderImages() {
  try {
    console.log('🔄 Fixing order images...');
    
    // Step 1: Check if we can access order_items table
    console.log('📝 Step 1: Checking order_items table...');
    
    const { data: testData, error: testError } = await supabase
      .from('order_items')
      .select('id, product_id, product_name, product_price, quantity, total_price')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error accessing order_items table:', testError);
      return;
    }
    
    console.log('✅ order_items table accessible');
    
    // Step 2: Get all order_items with their product images
    console.log('🔄 Step 2: Getting order_items with product images...');
    
    const { data: orderItems, error: fetchError } = await supabase
      .from('order_items')
      .select(`
        id,
        product_id,
        product_name,
        product_price,
        quantity,
        total_price,
        products!inner(image_url)
      `);
    
    if (fetchError) {
      console.error('❌ Error fetching order_items:', fetchError);
      return;
    }
    
    if (!orderItems || orderItems.length === 0) {
      console.log('ℹ️ No order_items found');
      return;
    }
    
    console.log(`📊 Found ${orderItems.length} order_items`);
    
    // Step 3: Update each order_item with product_image_url
    console.log('🔄 Step 3: Updating order_items with product images...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of orderItems) {
      try {
        const { error: updateError } = await supabase
          .from('order_items')
          .update({ 
            product_image_url: item.products.image_url 
          })
          .eq('id', item.id);
        
        if (updateError) {
          console.error(`❌ Error updating order_item ${item.id}:`, updateError);
          errorCount++;
        } else {
          successCount++;
          console.log(`✅ Updated order_item ${item.id} with image: ${item.products.image_url}`);
        }
      } catch (error) {
        console.error(`❌ Exception updating order_item ${item.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`🎉 Migration completed!`);
    console.log(`✅ Successfully updated: ${successCount} order_items`);
    if (errorCount > 0) {
      console.log(`❌ Failed to update: ${errorCount} order_items`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

fixOrderImages();
