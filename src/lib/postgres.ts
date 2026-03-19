import { Pool } from 'pg';

let pool: Pool | null = null;

function getConnectionConfig() {
	const connectionString = process.env.DATABASE_URL?.trim();

	if (connectionString) {
		return { connectionString };
	}

	const host = process.env.POSTGRES_HOST?.trim() || 'localhost';
	const port = Number.parseInt(process.env.POSTGRES_PORT?.trim() || '', 10);
	const user = process.env.POSTGRES_USER?.trim();
	const database = process.env.POSTGRES_DB?.trim();
	const password = process.env.POSTGRES_PASSWORD;

	if (!password) {
		throw new Error('POSTGRES_PASSWORD not defined');
	}
	if (Number.isNaN(port)) {
		throw new Error('POSTGRES_PORT no es un numero valido.');
	}

	return {
		host,
		port,
		user,
		database,
		password,
	};
}

export function getDb(): Pool {
	if (!pool) {
		pool = new Pool(getConnectionConfig());
	}

	return pool;
}

let initialized = false;

export async function initializeDatabase(): Promise<void> {
	if (initialized) return;

	const db = getDb();
	// players table
	await db.query(`
    CREATE TABLE IF NOT EXISTS players (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      dni TEXT NOT NULL UNIQUE,
      position TEXT,
      category TEXT,
      attendance INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT true,
      date_of_birth TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);

	// matches table
	await db.query(`
    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      opponent TEXT NOT NULL,
      result TEXT NOT NULL,
      referee TEXT NOT NULL,
      date DATE NOT NULL,
      category TEXT,
      home BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);

	// match_players table
	await db.query(`
    CREATE TABLE IF NOT EXISTS match_players (
      id SERIAL PRIMARY KEY,
      match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      minutes_played INTEGER NOT NULL DEFAULT 0,
      goals INTEGER NOT NULL DEFAULT 0,
      assists INTEGER NOT NULL DEFAULT 0,
      yellow_cards INTEGER NOT NULL DEFAULT 0,
      red_cards INTEGER NOT NULL DEFAULT 0,
      starter BOOLEAN NOT NULL DEFAULT true,
      minute_login INTEGER,
      calification INTEGER,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      UNIQUE(match_id, player_id)
    )
  `);
	initialized = true;
}

export async function closeDb(): Promise<void> {
	if (pool) {
		await pool.end();
		pool = null;
	}
}
