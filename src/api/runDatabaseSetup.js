/**
 * Database Setup Script
 * 
 * This script outputs the SQL that needs to be run in Supabase Dashboard
 * Go to: https://app.supabase.com/project/_/sql/new
 * Paste the SQL and run it
 */

const fs = require('fs');
const path = require('path');

const sqlFile = path.join(__dirname, 'databaseSetup.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

console.log('='.repeat(70));
console.log('DATABASE SETUP INSTRUCTIONS');
console.log('='.repeat(70));
console.log();
console.log('1. Go to your Supabase Dashboard:');
console.log('   https://app.supabase.com/project/_/sql/new');
console.log();
console.log('2. Copy and paste the following SQL, then click "Run"');
console.log();
console.log('-'.repeat(70));
console.log(sql);
console.log('-'.repeat(70));
console.log();
console.log('3. After running, verify tables were created:');
console.log('   SELECT * FROM information_schema.tables WHERE table_schema = \'public\';');
console.log();
console.log('This will create:');
console.log('  - files table (for user mode encrypted file storage)');
console.log('  - encryption_logs table (for activity history)');
console.log('  - RLS policies for security');
console.log('  - Auto-expiration for 24-hour retention');
console.log('='.repeat(70));
