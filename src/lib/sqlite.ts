import Database from 'better-sqlite3';
import path from 'path';

// route to the database file
const dbPath = path.join(process.cwd(), '..', 'db', 'ftm.db');

let db: Database.Database | null = null;

// get or create the database connection
export function getDb(): Database.Database {
	if (!db) {
		db = new Database(dbPath);
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

	// matches table
	db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opponent TEXT NOT NULL,
      result TEXT NOT NULL,
      referee TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT,
      home INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (date('now'))
    )
  `);

	// match_players table
	db.exec(`
    CREATE TABLE IF NOT EXISTS match_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      minutes_played INTEGER NOT NULL DEFAULT 0,
      goals INTEGER NOT NULL DEFAULT 0,
      assists INTEGER NOT NULL DEFAULT 0,
      yellow_cards INTEGER NOT NULL DEFAULT 0,
      red_cards INTEGER NOT NULL DEFAULT 0,
      starter INTEGER NOT NULL DEFAULT 1,
      minute_login INTEGER,
      calification INTEGER,
      created_at TEXT NOT NULL DEFAULT (date('now')),
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
      UNIQUE(match_id, player_id)
    )
  `);
}

// Close the database connection when the process exits
export function closeDb() {
	if (db) {
		db.close();
		db = null;
	}
}
