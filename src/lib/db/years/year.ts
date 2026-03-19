import { getDb } from '../../postgres';

export interface Year {
	years: number[];
}

export async function getAvailableYears(): Promise<number[]> {
	const db = getDb();
	const result = await db.query(
		`SELECT DISTINCT EXTRACT(YEAR FROM date::date) as year FROM matches ORDER BY year DESC`
	);
	return result.rows.map((row: any) => parseInt(row.year));
}
