import { getDbReady } from '../../postgres';

export interface Match {
	id: number;
	opponent: string;
	result: string;
	referee: string;
	date: string;
	category: string;
	home: boolean;
	created_at: string;
}

export interface MatchInput extends Omit<Match, 'id' | 'created_at'> {}

export async function getAllMatches(): Promise<Match[]> {
	const db = await getDbReady();
	const result = await db.query('SELECT * FROM matches ORDER BY date DESC');
	return result.rows;
}

export async function getMatchesByYear(year: number): Promise<Match[]> {
	const db = await getDbReady();
	const result = await db.query(
		`SELECT * FROM matches WHERE EXTRACT(YEAR FROM date::date) = $1 ORDER BY date DESC`,
		[year]
	);
	return result.rows;
}

export async function getMatch(id: number): Promise<Match | undefined> {
	const db = await getDbReady();
	const result = await db.query('SELECT * FROM matches WHERE id = $1', [id]);
	return result.rows[0] ?? undefined;
}

export async function createMatch(data: MatchInput): Promise<Match> {
	const db = await getDbReady();

	const result = await db.query(
		`INSERT INTO matches (opponent, result, referee, date, category, home)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id`,
		[data.opponent, data.result, data.referee, data.date, data.category, data.home]
	);

	const newMatch = await getMatch(result.rows[0].id);
	if (!newMatch) {
		throw new Error('Error al crear el partido');
	}
	return newMatch;
}

export async function updateMatch(id: number, data: Partial<MatchInput>): Promise<Match> {
	const db = await getDbReady();

	const match = await getMatch(id);
	if (!match) {
		throw new Error('Partido no encontrado');
	}

	const fields = Object.keys(data);
	if (fields.length === 0) {
		return match;
	}

	const values: any[] = fields.map((field) => data[field as keyof typeof data]);
	const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
	values.push(id);

	await db.query(`UPDATE matches SET ${setClause} WHERE id = $${fields.length + 1}`, values);

	return (await getMatch(id))!;
}

export async function deleteMatch(id: number): Promise<void> {
	const db = await getDbReady();
	const result = await db.query('DELETE FROM matches WHERE id = $1', [id]);
	if (result.rowCount === 0) {
		throw new Error('Partido no encontrado');
	}
}
