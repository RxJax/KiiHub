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
    // 1. Initialize Tables
    console.log("Initializing database schemas...");
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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        hash VARCHAR(255) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        timestamp BIGINT NOT NULL,
        status VARCHAR(20) NOT NULL,
        user_address VARCHAR(255) NOT NULL,
        block_number INTEGER,
        details TEXT,
        xp_earned INTEGER DEFAULT 0,
        game_played VARCHAR(50)
      );
    `);
    console.log("✅ Tables users and activities verified.");

    // 2. Insert test activity
    const testAct = {
      hash: "0xtxmockactivityhash" + Math.random().toString(36).substring(2, 8),
      type: "Faucet Claim",
      timestamp: Date.now(),
      status: "success",
      user_address: "0xtestbuilder001aa367a76d65cca9a20aa9ae4c7d0926",
      block_number: 10293,
      details: "0xtest...d0926 claimed 10 KII from testnet faucet",
      xp_earned: 50,
      game_played: null
    };

    console.log(`Inserting test activity hash: ${testAct.hash}...`);
    await pool.query(`
      INSERT INTO activities (hash, type, timestamp, status, user_address, block_number, details, xp_earned, game_played)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (hash) DO UPDATE SET
        type = EXCLUDED.type,
        status = EXCLUDED.status,
        details = EXCLUDED.details,
        xp_earned = EXCLUDED.xp_earned,
        game_played = EXCLUDED.game_played
    `, [
      testAct.hash,
      testAct.type,
      testAct.timestamp,
      testAct.status,
      testAct.user_address,
      testAct.block_number,
      testAct.details,
      testAct.xp_earned,
      testAct.game_played
    ]);
    console.log("✅ Activity insert completed.");

    // 3. Query Activities (using LEFT JOIN on users to fetch avatar & name)
    console.log("Querying activities with user profile details...");
    const res = await pool.query(`
      SELECT a.hash, a.type, a.timestamp, a.user_address, a.details, a.xp_earned,
             u.username, u.avatar
      FROM activities a
      LEFT JOIN users u ON a.user_address = u.address
      ORDER BY a.timestamp DESC
      LIMIT 10
    `);

    console.log("Activities Results:");
    console.table(res.rows);

  } catch (error) {
    console.error("❌ Test database operation failed:", error);
  } finally {
    await pool.end();
  }
}

main();
