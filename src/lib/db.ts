// @ts-ignore
import { DatabaseSync } from "node:sqlite";
import path from "path";
import { EventEmitter } from "events";

const DB_PATH = path.join(process.cwd(), "kii_builder.db");

// Define a global event emitter for database events
export const dbEvents = new EventEmitter();

// Log global events to satisfy the trigger requirement
dbEvents.on("xpChanged", (event) => {
  console.log(`[Global DB Event] User ${event.address} (${event.username}) XP updated: ${event.oldXp} -> ${event.newXp}`);
});

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    
    // Create users table
    db.exec(`
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
  }
  return db;
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
  // Pull all user accounts, sorting them automatically in descending order based on their total XP
  const stmt = database.prepare(`
    SELECT address, username, avatar, title, level, total_xp, contracts
    FROM users
    WHERE total_xp > 0
    ORDER BY total_xp DESC, level DESC, contracts DESC
  `);
  
  return stmt.all() as Array<{
    address: string;
    username: string;
    avatar: string;
    title: string;
    level: number;
    total_xp: number;
    contracts: number;
  }>;
}
