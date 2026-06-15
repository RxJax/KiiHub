// @ts-ignore
import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";
import { EventEmitter } from "events";

const isVercel = process.env.VERCEL === "1" || process.env.NOW_BUILDER === "1";
let DB_PATH = path.join(process.cwd(), "kii_builder.db");

if (isVercel) {
  const tmpDbPath = path.join("/tmp", "kii_builder.db");
  // Copy the seeded database from the read-only workspace to /tmp if it doesn't exist
  if (!fs.existsSync(tmpDbPath)) {
    try {
      if (fs.existsSync(DB_PATH)) {
        fs.copyFileSync(DB_PATH, tmpDbPath);
        console.log("[DB Vercel] Seeded kii_builder.db copied to /tmp successfully.");
      } else {
        console.warn("[DB Vercel] Seeded kii_builder.db not found at:", DB_PATH);
      }
    } catch (e) {
      console.warn("[DB Vercel] Failed to copy kii_builder.db to /tmp:", e);
    }
  }
  DB_PATH = tmpDbPath;
}

// Define a global event emitter for database events
export const dbEvents = new EventEmitter();

// Log global events to satisfy the trigger requirement
dbEvents.on("xpChanged", (event) => {
  console.log(`[Global DB Event] User ${event.address} (${event.username}) XP updated: ${event.oldXp} -> ${event.newXp}`);
});

// Persist database instance across hot reloads in Next.js development mode
const globalForDb = globalThis as unknown as {
  db: DatabaseSync | undefined;
};

export function getDb(): DatabaseSync {
  if (!globalForDb.db) {
    const dbInstance = new DatabaseSync(DB_PATH);
    
    // Create users table
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS users (
        address TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        avatar TEXT,
        title TEXT,
        level INTEGER DEFAULT 1,
        total_xp INTEGER DEFAULT 0,
        contracts INTEGER DEFAULT 0,
        last_updated INTEGER
      );
    `);

    // Seeding mock users disabled. Only real users who have earned XP will show up.
    
    globalForDb.db = dbInstance;
  }
  return globalForDb.db;
}

export function upsertUser(user: {
  address: string;
  username: string;
  avatar: string;
  title: string;
  level: number;
  total_xp: number;
  contracts: number;
}) {
  const database = getDb();
  
  // Clean / normalize address
  const cleanAddr = user.address.trim().toLowerCase();

  // Get previous XP to determine if it changed
  const stmtSelect = database.prepare("SELECT total_xp FROM users WHERE address = ?");
  const row = stmtSelect.get(cleanAddr) as { total_xp: number } | undefined;
  const oldXp = row ? row.total_xp : null;

  const stmt = database.prepare(`
    INSERT INTO users (address, username, avatar, title, level, total_xp, contracts, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(address) DO UPDATE SET
      username = excluded.username,
      avatar = excluded.avatar,
      title = excluded.title,
      level = excluded.level,
      total_xp = excluded.total_xp,
      contracts = excluded.contracts,
      last_updated = excluded.last_updated
  `);
  
  const now = Date.now();
  stmt.run(
    cleanAddr,
    user.username,
    user.avatar,
    user.title,
    user.level,
    user.total_xp,
    user.contracts,
    now
  );

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

export function getLeaderboard() {
  const database = getDb();
  
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

  const stmt = database.prepare(query);
  return (stmt.all() || []) as Array<{
    address: string;
    username: string;
    avatar: string;
    title: string;
    level: number;
    total_xp: number;
    contracts: number;
  }>;
}

