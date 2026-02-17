import Database from 'better-sqlite3';
import path from 'path';

// route to the database file
const dbPath = path.join(process.cwd(), '..', 'db', 'ftm.db');

let db: Database.Database | null = null;

// get or create the database connection
export function getDb(): Database.Database {
	if (!db) {
		db = new Database(dbPath, { verbose: console.log });
		db.pragma('journal_mode = WAL');
		initializeDatabase();
	}
	return db;
}

function initializeDatabase() {
	if (!db) return;

	// players table
	db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      dni TEXT NOT NULL UNIQUE,
      position TEXT,
      category TEXT,
      attendance INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      date_of_birth TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (date('now'))
    )
  `);

	console.log('Base de datos inicializada');
}

// Close the database connection when the process exits
export function closeDb() {
	if (db) {
		db.close();
		db = null;
	}
}
