const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(':memory:');

db.exec(`
  CREATE TABLE test (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    val TEXT
  );
`);

const insert = db.prepare('INSERT INTO test (val) VALUES (?)');
insert.run('hello');

const query = db.prepare('SELECT * FROM test');
console.log(query.all());
