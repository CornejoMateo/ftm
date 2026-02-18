import { getDb } from '../sqlite';

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

function rowToMatch(row: any): Match {
	return {
		...row,
		home: Boolean(row.home),
	};
}

function matchToRow(match: Partial<Match>): any {
	const row: any = { ...match };
	if (typeof row.home === 'boolean') {
		row.home = row.home ? 1 : 0;
	}
	return row;
}

export function getAllMatches(): Match[] {
	const db = getDb();
	const stmt = db.prepare('SELECT * FROM matches ORDER BY date DESC');
	const rows = stmt.all();

	return rows.map((row: any) => rowToMatch(row));
}

export function getMatchesByYear(year: number): Match[] {
	const db = getDb();
	const stmt = db.prepare(`
		SELECT * FROM matches 
		WHERE strftime('%Y', date) = ? 
		ORDER BY date DESC
	`);
	const rows = stmt.all(year.toString());

	return rows.map((row: any) => rowToMatch(row));
}

export function getMatch(id: number): Match | undefined {
	const db = getDb();
	const stmt = db.prepare('SELECT * FROM matches WHERE id = ?');
	const row = stmt.get(id) as any;

	if (!row) return undefined;

	return rowToMatch(row);
}

export function createMatch(data: MatchInput): Match {
	const db = getDb();

	const rowData = matchToRow(data);
	const stmt = db.prepare(`
		INSERT INTO matches (opponent, result, referee, date, category, home)
		VALUES (@opponent, @result, @referee, @date, @category, @home)
	`);

	const result = stmt.run(rowData);

	const newMatch = getMatch(result.lastInsertRowid as number);

	if (!newMatch) {
		throw new Error('Error al crear el partido');
	}

	return newMatch;
}

export function updateMatch(id: number, data: Partial<MatchInput>): Match {
	const db = getDb();

	const match = getMatch(id);
	if (!match) {
		throw new Error('Partido no encontrado');
	}

	const fields = Object.keys(data);
	if (fields.length === 0) {
		return match;
	}

	const rowData = matchToRow(data);
	const setClause = fields.map((field) => `${field} = @${field}`).join(', ');
	const stmt = db.prepare(`UPDATE matches SET ${setClause} WHERE id = @id`);

	stmt.run({ ...rowData, id });

	return getMatch(id)!;
}

export function deleteMatch(id: number): void {
	const db = getDb();

	const stmt = db.prepare('DELETE FROM matches WHERE id = ?');
	const result = stmt.run(id);

	if (result.changes === 0) {
		throw new Error('Partido no encontrado');
	}
}
