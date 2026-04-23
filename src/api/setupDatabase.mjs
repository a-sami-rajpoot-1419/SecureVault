/**
 * Database Setup Script
 * Run with: node src/api/setupDatabase.mjs
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Client } = pg;

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const sqlFile = path.join(__dirname, 'databaseSetup.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

async function setupDatabase() {
  console.log('🔌 Connecting to database...');
  
  const client = new Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    console.log('');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);
    console.log('');

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await client.query(stmt + ';');
        const firstLine = stmt.split('\n')[0].substring(0, 60);
        console.log(`  ✓ ${i + 1}. ${firstLine}...`);
      } catch (e) {
        if (e.message.includes('already exists') || e.message.includes('duplicate')) {
          console.log(`  ⏭️  ${i + 1}. Already exists, skipping`);
        } else {
          console.error(`  ✗ ${i + 1}. Error: ${e.message}`);
        }
      }
    }

    console.log('');
    console.log('🔍 Verifying setup...');

    // Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('files', 'encryption_logs')
    `);
    console.log('📊 Tables created:', tables.rows.map(r => r.table_name).join(', ') || 'None');

    // Check RLS policies
    const policies = await client.query(`
      SELECT policyname, tablename 
      FROM pg_policies 
      WHERE schemaname = 'public'
    `);
    console.log('🔒 RLS policies:', policies.rows.length);
    policies.rows.forEach(p => {
      console.log(`   - ${p.policyname} on ${p.tablename}`);
    });

    console.log('');
    console.log('✅ Database setup complete!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Enable storage in Supabase Dashboard');
    console.log('   2. Set up storage bucket policies');
    console.log('   3. Test file upload/retention');

  } catch (error) {
    console.error('❌ Failed to connect:', error.message);
    console.error('Error details:', error);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   1. Check your .env file has correct credentials');
    console.log('   2. Ensure database is accessible from your IP');
    console.log('   3. For Supabase: check project settings for connection info');
    console.log('   4. You may need to whitelist your IP in Supabase settings');
    console.log('');
    console.log('📋 Alternative: Run SQL manually in Supabase Dashboard');
    console.log('   https://app.supabase.com/project/_/sql/new');
    console.log('   Paste the contents of src/api/databaseSetup.sql');
  } finally {
    await client.end();
  }
}

setupDatabase();
