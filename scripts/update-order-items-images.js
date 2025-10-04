const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateOrderItemsImages() {
  try {
    console.log('🔄 Updating order_items with product images...');
    
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
      return;
    }
    
    console.log(`📊 Found ${orderItems.length} order_items to update`);
    
    // Update each order_item
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
        console.log(`✅ Updated order_item ${item.id}`);
      }
    }
    
    console.log('🎉 All order_items updated successfully!');
    
  } catch (error) {
    console.error('❌ Update failed:', error);
  }
}

updateOrderItemsImages();
