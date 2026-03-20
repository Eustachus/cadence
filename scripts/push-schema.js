const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres.acchqabawvlbggjysmix:UoAgpmiDTJU90O4a@aws-1-eu-west-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000
  });

  console.log('Connecting to Supabase...');
  await client.connect();
  console.log('Connected!');

  const sql = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'schema.sql'), 'utf8');
  console.log('Executing schema...');
  
  await client.query(sql);
  console.log('Schema created!');

  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log('\nTables created:', tables.rows.map(r => r.table_name).join(', '));
  
  await client.end();
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
