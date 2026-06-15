const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "kii_builder.db");
console.log("Opening database at:", DB_PATH);
const db = new DatabaseSync(DB_PATH);

console.log("Resetting all users to 0 XP, Level 1, 0 Contracts...");
try {
  const stmt = db.prepare("UPDATE users SET total_xp = 0, level = 1, contracts = 0, last_updated = ?");
  const result = stmt.run(Date.now());
  console.log("Database update result:", result);
  
  // Verify the update
  const selectStmt = db.prepare("SELECT * FROM users");
  const users = selectStmt.all();
  console.log("Verification - updated users:");
  console.log(JSON.stringify(users, null, 2));
} catch (e) {
  console.error("Reset failed:", e.message);
}
