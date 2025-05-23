// Test Supabase Connection
// Run this with: node test-supabase-connection.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl ? 'Set ✓' : 'Missing ✗');
console.log('Key:', supabaseAnonKey ? 'Set ✓' : 'Missing ✗');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Environment variables not properly set');
  process.exit(1);
}

console.log('Full URL:', supabaseUrl);
console.log('Key preview:', supabaseAnonKey.substring(0, 50) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('📡 Attempting to connect to Supabase...');
    
    // First, let's try to list all tables to see what exists
    console.log('🔍 Checking what tables exist...');
    
    // Try a simple RPC call or query to test basic connectivity
    const { data: rpcData, error: rpcError } = await supabase.rpc('version');
    
    if (rpcError) {
      console.log('RPC test failed, trying direct table queries...');
    } else {
      console.log('✅ Basic RPC connection successful!');
    }
    
    // Try each table one by one to see which ones exist and have data
    const tables = ['income_streams', 'ideas', 'mentorship_sessions', 'content_metrics', 'newsletter_stats', 'operational_areas'];
    
    for (const table of tables) {
      console.log(`🔍 Testing table: ${table}`);
      
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: Found ${count || 0} records`);
      }
    }
    
    // If any table works, try to get a sample record
    console.log('📝 Trying to get sample data from income_streams...');
    const { data: sample, error: sampleError } = await supabase
      .from('income_streams')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Sample query failed:', sampleError.message);
    } else {
      console.log('✅ Sample data retrieved:', sample);
    }
    
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    console.error('Full error:', err);
  }
}

testConnection(); 