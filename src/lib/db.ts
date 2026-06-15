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

    // Seed mock profiles if the database is brand new and empty
    try {
      const stmtCheck = dbInstance.prepare("SELECT COUNT(*) as count FROM users");
      const result = stmtCheck.get() as { count: number };
      if (result.count === 0) {
        const initialUsers = [
          {
            address: "0x52370a367a76d65cca9a20aa9ae4c7d092683b9a",
            username: "RxJax",
            avatar: "🦊",
            title: "Grandmaster Architect",
            level: 24,
            total_xp: 8500,
            contracts: 12
          },
          {
            address: "0x7b58c57f2c11c35679b6433b42fecd3a29146aba",
            username: "AlphaCoder",
            avatar: "🚀",
            title: "Senior Developer",
            level: 18,
            total_xp: 5200,
            contracts: 8
          },
          {
            address: "0x1d084a1b7692cddfb60d4db0da44ba5bf9db6886",
            username: "KiiWhale",
            avatar: "🌌",
            title: "Liquidity Provider",
            level: 15,
            total_xp: 4100,
            contracts: 5
          },
          {
            address: "0x7249ee4ee06d93dd2ed5a8b9051ae0484273d1c9",
            username: "CryptoMaster",
            avatar: "⚡",
            title: "Ecosystem Pioneer",
            level: 12,
            total_xp: 3100,
            contracts: 3
          }
        ];

        const stmtInsert = dbInstance.prepare(`
          INSERT INTO users (address, username, avatar, title, level, total_xp, contracts, last_updated)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const now = Date.now();
        for (const u of initialUsers) {
          stmtInsert.run(
            u.address.toLowerCase(),
            u.username,
            u.avatar,
            u.title,
            u.level,
            u.total_xp,
            u.contracts,
            now
          );
        }
        console.log("[DB Seed] Successfully seeded 4 mock builder profiles.");
      }
    } catch (e: any) {
      console.warn("Failed to check or seed initial user profiles:", e.message);
    }
    
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
  // Pull all user accounts, sorting them automatically in descending order based on their total XP, with alphabetical fallback
  const stmt = database.prepare(`
    SELECT address, username, avatar, title, level, total_xp, contracts
    FROM users
    WHERE total_xp >= 0
    ORDER BY total_xp DESC, level DESC, contracts DESC, username ASC
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
