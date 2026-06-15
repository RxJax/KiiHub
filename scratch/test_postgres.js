const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Parse .env.local
const envPath = path.join(__dirname, "../.env.local");
let databaseUrl = process.env.DATABASE_URL;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(/^DATABASE_URL=(.*)$/m);
  if (match && match[1]) {
    databaseUrl = match[1].replace(/["']/g, "").trim();
  }
}

if (!databaseUrl) {
  console.error("❌ Error: DATABASE_URL not found in environment or .env.local file!");
  console.log("Please define DATABASE_URL in .env.local first.");
  process.exit(1);
}

console.log("Connecting to PostgreSQL...");
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    // 1. Initialize Table
    console.log("Initializing database schema...");
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
    console.log("✅ Table 'users' verified/created.");

    // 2. Upsert a test user from incognito/test browser
    const testUser = {
      address: "0xtestbuilder001aa367a76d65cca9a20aa9ae4c7d0926",
      username: "ProBuilderIncognito",
      avatar: "🔮",
      title: "Arch-Mage",
      level: 4,
      total_xp: 1250,
      contracts: 3,
      last_updated: Date.now()
    };

    console.log(`Upserting test user: ${testUser.username} (${testUser.address})...`);
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
      testUser.address,
      testUser.username,
      testUser.avatar,
      testUser.title,
      testUser.level,
      testUser.total_xp,
      testUser.contracts,
      testUser.last_updated
    ]);
    console.log("✅ User upsert completed.");

    // 3. Query Leaderboard
    console.log("Querying Leaderboard rankings...");
    const res = await pool.query(`
      SELECT address, username, avatar, title, level, total_xp, contracts
      FROM users
      WHERE total_xp > 0
      ORDER BY total_xp DESC
      LIMIT 10
    `);

    console.log("Leaderboard Results:");
    console.table(res.rows);

  } catch (error) {
    console.error("❌ Test database operation failed:", error);
  } finally {
    await pool.end();
  }
}

main();
