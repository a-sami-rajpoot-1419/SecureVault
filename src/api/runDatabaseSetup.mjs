/**
 * Database Setup Script
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFile = path.join(__dirname, 'databaseSetup.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

console.log('='.repeat(70));
console.log('DATABASE SETUP INSTRUCTIONS');
console.log('='.repeat(70));
console.log();
console.log('1. Go to your Supabase Dashboard:');
console.log('   https://app.supabase.com/project/_/sql/new');
console.log();
console.log('2. Copy and paste the SQL below, then click "Run"');
console.log();
console.log('-'.repeat(70));
console.log(sql);
console.log('-'.repeat(70));
