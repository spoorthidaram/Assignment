
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const databaseDirectory = path.join(__dirname);

if (!fs.existsSync(databaseDirectory)) {
    fs.mkdirSync(databaseDirectory, { recursive: true });
}

const db = new Database(
    path.join(databaseDirectory, "lenslab.db")
);

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS photographers (
    photographer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cameras (
    camera_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Available'
  );

  CREATE TABLE IF NOT EXISTS rentals (
    rental_id INTEGER PRIMARY KEY AUTOINCREMENT,
    photographer_id INTEGER NOT NULL,
    camera_id INTEGER NOT NULL,
    rental_date TEXT NOT NULL,
    return_date TEXT,
    FOREIGN KEY (photographer_id)
      REFERENCES photographers(photographer_id),
    FOREIGN KEY (camera_id)
      REFERENCES cameras(camera_id)
  );
`);

module.exports = db;
