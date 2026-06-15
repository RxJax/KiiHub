import { Pool } from "pg";
import { EventEmitter } from "events";

const databaseUrl = process.env.DATABASE_URL;

// Define a global event emitter for database events
export const dbEvents = new EventEmitter();

// Log global events
dbEvents.on("xpChanged", (event) => {
  console.log(`[Global DB Event] User ${event.address} (${event.username}) XP updated: ${event.oldXp} -> ${event.newXp}`);
});

// Cache database connection pool across hot reloads in development and serverless executions
const globalForPg = globalThis as unknown as {
  pgPool: Pool | undefined;
};

export function getPool(): Pool {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is missing. Please add it to your .env.local file.");
  }
  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10, // Max concurrent connections in pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return globalForPg.pgPool;
}

let isInitialized = false;

export async function initDb() {
  if (isInitialized) return;
  const pool = getPool();
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      address VARCHAR(255) PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      avatar TEXT,
      title VARCHAR(255),
      level INTEGER DEFAULT 1,
      total_xp INTEGER DEFAULT 0,
      contracts INTEGER DEFAULT 0,
      last_updated BIGINT
    );
  `);
  isInitialized = true;
}

export async function upsertUser(user: {
  address: string;
  username: string;
  avatar: string;
  title: string;
  level: number;
  total_xp: number;
  contracts: number;
}) {
  await initDb();
  const pool = getPool();
  
  // Clean / normalize address
  const cleanAddr = user.address.trim().toLowerCase();

  // Get previous XP to determine if it changed
  const selectRes = await pool.query("SELECT total_xp FROM users WHERE address = $1", [cleanAddr]);
  const row = selectRes.rows[0];
  const oldXp = row ? row.total_xp : null;

  const now = Date.now();
  await pool.query(`
    INSERT INTO users (address, username, avatar, title, level, total_xp, contracts, last_updated)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (address) DO UPDATE SET
      username = EXCLUDED.username,
      avatar = EXCLUDED.avatar,
      title = EXCLUDED.title,
      level = EXCLUDED.level,
      total_xp = EXCLUDED.total_xp,
      contracts = EXCLUDED.contracts,
      last_updated = EXCLUDED.last_updated
  `, [
    cleanAddr,
    user.username,
    user.avatar,
    user.title,
    user.level,
    user.total_xp,
    user.contracts,
    now
  ]);

  // If XP changed, emit global event
  if (oldXp === null || oldXp !== user.total_xp) {
    dbEvents.emit("xpChanged", {
      address: cleanAddr,
      oldXp,
      newXp: user.total_xp,
      username: user.username
    });
  }
}

export async function getLeaderboard() {
  await initDb();
  const pool = getPool();
  
  const query = `
    SELECT address, username, avatar, title, 
           COALESCE(level, 1) as level, 
           COALESCE(total_xp, 0) as total_xp, 
           COALESCE(contracts, 0) as contracts
    FROM users
    WHERE COALESCE(total_xp, 0) > 0
    ORDER BY COALESCE(total_xp, 0) DESC, COALESCE(level, 1) DESC, COALESCE(contracts, 0) DESC, username ASC
    LIMIT 100
  `;

  const res = await pool.query(query);
  return (res.rows || []) as Array<{
    address: string;
    username: string;
    avatar: string;
    title: string;
    level: number;
    total_xp: number;
    contracts: number;
  }>;
}
