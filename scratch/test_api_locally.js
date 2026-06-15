const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "kii_builder.db");
console.log("Opening database at:", DB_PATH);
const db = new DatabaseSync(DB_PATH);

console.log("Testing leaderboard query (WHERE total_xp >= 0):");
try {
  const stmt = db.prepare(`
    SELECT address, username, avatar, title, level, total_xp, contracts
    FROM users
    WHERE total_xp >= 0
    ORDER BY total_xp DESC, level DESC, contracts DESC
  `);
  const data = stmt.all();
  console.log("Returned data length:", data.length);
  console.log("Data:", JSON.stringify(data, null, 2));
} catch (e) {
  console.error("Query failed:", e.message);
}
