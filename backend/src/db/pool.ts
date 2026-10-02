import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
const exigeSsl = connectionString?.includes('sslmode=require') ?? false;

export const pool = new Pool({
  connectionString,
  ssl: exigeSsl ? { rejectUnauthorized: false } : undefined,
});

export async function checkConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
  }
}
