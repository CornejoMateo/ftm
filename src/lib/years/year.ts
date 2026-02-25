import { getDb } from '../sqlite';

export interface Year {
	years: number[];
}

export function getAvailableYears(): number[] {
	const db = getDb();
	const stmt = db.prepare(`
		SELECT DISTINCT strftime('%Y', date) as year 
		FROM matches 
		ORDER BY year DESC
	`);
	const rows = stmt.all() as { year: string }[];
	return rows.map(row => parseInt(row.year));
}
