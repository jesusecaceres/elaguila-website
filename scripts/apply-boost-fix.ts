import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyBoostFix() {
  try {
    console.log('Applying boost_expires fix...');
    
    const sqlPath = join(__dirname, 'apply-boost-expires-fix.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error applying fix:', error);
      process.exit(1);
    }
    
    console.log('Boost expires fix applied successfully');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

applyBoostFix();
