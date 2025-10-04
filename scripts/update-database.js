// Script to update database schema
// Run with: node scripts/update-database.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateDatabase() {
  try {
    console.log('🔄 Updating database schema...');
    
    // Check if columns already exist
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users')
      .in('column_name', ['addresses', 'default_address_index']);
    
    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError);
      return;
    }
    
    const existingColumns = columns.map(col => col.column_name);
    
    if (existingColumns.includes('addresses') && existingColumns.includes('default_address_index')) {
      console.log('✅ Columns already exist, skipping migration');
      return;
    }
    
    // Run migration SQL
    const migrationSQL = `
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS addresses JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS default_address_index INTEGER DEFAULT 0;
      
      UPDATE users 
      SET addresses = '[]'::jsonb 
      WHERE addresses IS NULL;
      
      UPDATE users 
      SET default_address_index = 0 
      WHERE default_address_index IS NULL;
    `;
    
    const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (migrationError) {
      console.error('❌ Migration error:', migrationError);
      return;
    }
    
    console.log('✅ Database schema updated successfully!');
    
    // Verify the changes
    const { data: users, error: verifyError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, addresses, default_address_index')
      .limit(3);
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
      return;
    }
    
    console.log('📋 Sample users after migration:');
    console.table(users);
    
  } catch (error) {
    console.error('❌ Error updating database:', error);
  }
}

updateDatabase();
