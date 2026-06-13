const { Pool } = require('pg');
const { PostgresSaver } = require('@langchain/langgraph-checkpoint-postgres');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const saver = new PostgresSaver(pool);
    console.log('Setting up PostgresSaver...');
    await saver.setup();
    console.log('PostgresSaver setup complete.');

    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'checkpoint%'");
    console.log('Tables created:', res.rows);
  } catch (err) {
    console.error('Setup failed:', err);
  } finally {
    await pool.end();
  }
}

main();
