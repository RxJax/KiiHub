const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "kii_builder.db");
console.log("Opening database at:", DB_PATH);
const db = new DatabaseSync(DB_PATH);

// 1. Create table
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

// 2. Seeding logic
try {
  const stmtCheck = db.prepare("SELECT COUNT(*) as count FROM users");
  const result = stmtCheck.get();
  console.log("Current user count in db:", result.count);
  
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

    const stmtInsert = db.prepare(`
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
} catch (e) {
  console.error("Checking/seeding failed:", e.message);
}

// 3. Query all users where total_xp > 0
try {
  const stmt = db.prepare(`
    SELECT address, username, avatar, title, level, total_xp, contracts
    FROM users
    WHERE total_xp > 0
    ORDER BY total_xp DESC, level DESC, contracts DESC
  `);
  console.log("Leaderboard results:", stmt.all());
} catch (e) {
  console.error("Leaderboard query failed:", e.message);
}
