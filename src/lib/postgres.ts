import { Pool } from 'pg';

let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

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

export async function initializeDatabase(): Promise<void> {
	if (initPromise) return initPromise;

	initPromise = (async () => {
		const db = getDb();
		// players table
		await db.query(`
			CREATE TABLE IF NOT EXISTS players (
			id SERIAL PRIMARY KEY,
			name TEXT,
			last_name TEXT,
			dni TEXT,
			position TEXT,
			category TEXT,
			attendance INTEGER DEFAULT 0,
			active BOOLEAN DEFAULT true,
			date_of_birth TEXT,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
			)
		`);

		// matches table
		await db.query(`
			CREATE TABLE IF NOT EXISTS matches (
			id SERIAL PRIMARY KEY,
			opponent TEXT,
			result TEXT,
			referee TEXT,
			date TEXT,
			category TEXT,
			home BOOLEAN DEFAULT false,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
			)
		`);

		// match_players table
		await db.query(`
			CREATE TABLE IF NOT EXISTS match_players (
			id SERIAL PRIMARY KEY,
			match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
			player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
			minutes_played INTEGER DEFAULT 0,
			goals INTEGER DEFAULT 0,
			assists INTEGER DEFAULT 0,
			yellow_cards INTEGER DEFAULT 0,
			red_cards INTEGER DEFAULT 0,
			starter BOOLEAN DEFAULT true,
			minute_login INTEGER,
			calification DOUBLE PRECISION,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			UNIQUE(match_id, player_id)
			)
		`);

		// Migrate older installations where calification was stored as INTEGER.
		await db.query(`
			ALTER TABLE match_players
			ALTER COLUMN calification TYPE DOUBLE PRECISION
			USING calification::DOUBLE PRECISION
		`);
	})();

	await initPromise;
}

export async function getDbReady(): Promise<Pool> {
	await initializeDatabase();
	return getDb();
}

export async function closeDb(): Promise<void> {
	if (pool) {
		await pool.end();
		pool = null;
	}
}
