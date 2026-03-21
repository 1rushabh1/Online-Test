import { Pool } from "pg";

declare global {
  var _pgPool: Pool | undefined;
}

function createPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: {
      rejectUnauthorized: false, // ✅ REQUIRED for Neon
    },

    max: 5, // keep small for Neon free tier
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });
}

// reuse pool in dev
const pool = global._pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}

export default pool;

export async function query<T = any>(
  text: string,
  params?: any[],
): Promise<{ rows: T[]; rowCount: number | null }> {
  const client = await pool.connect();

  try {
    const result = await client.query(text, params);
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount,
    };
  } finally {
    client.release();
  }
}
