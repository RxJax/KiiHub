const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "kii_builder.db");
console.log("Opening database at:", DB_PATH);
const db = new DatabaseSync(DB_PATH);

// Create the users table if it doesn't exist to replicate getDb() behavior
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

console.log("Querying all users from database:");
try {
  const stmt = db.prepare("SELECT * FROM users");
  const users = stmt.all();
  console.log("Total users found:", users.length);
  console.log(JSON.stringify(users, null, 2));
} catch (e) {
  console.error("Query failed:", e.message);
}
