import { getDb } from '../../postgres';

export interface MatchPlayer {
	id: number;
	match_id: number;
	player_id: number;
	minutes_played: number;
	goals: number;
	assists: number;
	yellow_cards: number;
	red_cards: number;
	starter: boolean;
	minute_login: number | null;
	calification: number | null;
	created_at: string;
}

export interface MatchPlayerInput extends Omit<MatchPlayer, 'id' | 'created_at' | 'starter'> {
	starter: boolean;
}

export interface MatchPlayerWithMatchInfo extends MatchPlayer {
	match_date: string;
	match_opponent: string;
	match_result: string;
	match_home: boolean;
}

export async function getAllMatchPlayers(): Promise<MatchPlayer[]> {
	const db = getDb();
	const result = await db.query('SELECT * FROM match_players ORDER BY created_at DESC');
	return result.rows;
}

export async function getMatchPlayerByYear(year: number): Promise<MatchPlayer[]> {
	const db = getDb();
	const result = await db.query(
		`SELECT mp.* FROM match_players mp
        JOIN matches m ON mp.match_id = m.id
        WHERE EXTRACT(YEAR FROM m.date::date) = $1
        ORDER BY mp.created_at DESC`,
		[year]
	);
	return result.rows;
}

export async function getMatchPlayersByMatch(matchId: number): Promise<MatchPlayer[]> {
	const db = getDb();
	const result = await db.query('SELECT * FROM match_players WHERE match_id = $1', [matchId]);
	return result.rows;
}

export async function getMatchPlayersByPlayer(playerId: number): Promise<MatchPlayer[]> {
	const db = getDb();
	const result = await db.query(
		'SELECT * FROM match_players WHERE player_id = $1 ORDER BY created_at DESC',
		[playerId]
	);
	return result.rows;
}

export async function getMatchPlayersWithMatchInfo(
	playerId: number
): Promise<MatchPlayerWithMatchInfo[]> {
	const db = getDb();
	const result = await db.query(
		`SELECT
			mp.*,
			m.date as match_date,
			m.opponent as match_opponent,
			m.result as match_result,
			m.home as match_home
		FROM match_players mp
		JOIN matches m ON mp.match_id = m.id
		WHERE mp.player_id = $1
		ORDER BY m.date DESC`,
		[playerId]
	);
	return result.rows;
}

export async function getMatchPlayer(id: number): Promise<MatchPlayer | undefined> {
	const db = getDb();
	const result = await db.query('SELECT * FROM match_players WHERE id = $1', [id]);
	return result.rows[0] ?? undefined;
}

export async function getMatchPlayerByMatchAndPlayer(
	matchId: number,
	playerId: number
): Promise<MatchPlayer | undefined> {
	const db = getDb();
	const result = await db.query(
		'SELECT * FROM match_players WHERE match_id = $1 AND player_id = $2',
		[matchId, playerId]
	);
	return result.rows[0] ?? undefined;
}

export async function createMatchPlayer(data: MatchPlayerInput): Promise<MatchPlayer> {
	const db = getDb();

	const result = await db.query(
		`INSERT INTO match_players (
			match_id, player_id, minutes_played, goals, assists,
			yellow_cards, red_cards, starter, minute_login, calification
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id`,
		[
			data.match_id,
			data.player_id,
			data.minutes_played,
			data.goals,
			data.assists,
			data.yellow_cards,
			data.red_cards,
			data.starter,
			data.minute_login,
			data.calification,
		]
	);

	const newMatchPlayer = await getMatchPlayer(result.rows[0].id);
	if (!newMatchPlayer) {
		throw new Error('Error al crear la relación partido-jugador');
	}
	return newMatchPlayer;
}

export async function updateMatchPlayer(
	id: number,
	data: Partial<MatchPlayerInput>
): Promise<MatchPlayer> {
	const db = getDb();

	const matchPlayer = await getMatchPlayer(id);
	if (!matchPlayer) {
		throw new Error('Relación partido-jugador no encontrada');
	}

	const fields = Object.keys(data);
	if (fields.length === 0) {
		return matchPlayer;
	}

	const values: any[] = fields.map((field) => data[field as keyof typeof data]);
	const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
	values.push(id);

	await db.query(`UPDATE match_players SET ${setClause} WHERE id = $${fields.length + 1}`, values);

	return (await getMatchPlayer(id))!;
}

export async function deleteMatchPlayer(id: number): Promise<void> {
	const db = getDb();
	const result = await db.query('DELETE FROM match_players WHERE id = $1', [id]);
	if (result.rowCount === 0) {
		throw new Error('Relación partido-jugador no encontrada');
	}
}

export async function deleteMatchPlayersByMatch(matchId: number): Promise<void> {
	const db = getDb();
	await db.query('DELETE FROM match_players WHERE match_id = $1', [matchId]);
}

export async function deleteMatchPlayersByPlayer(playerId: number): Promise<void> {
	const db = getDb();
	await db.query('DELETE FROM match_players WHERE player_id = $1', [playerId]);
}

export async function getCurrentYearStats() {
	const currentYear = new Date().getFullYear();
	const db = getDb();

	const matchResult = await db.query(
		`SELECT COUNT(*) as count FROM matches WHERE EXTRACT(YEAR FROM date::date) = $1`,
		[currentYear]
	);
	const total_matches = parseInt(matchResult.rows[0]?.count || 0);

	const statsResult = await db.query(
		`SELECT
			SUM(mp.goals) as total_goals,
			SUM(mp.assists) as total_assists,
			SUM(mp.yellow_cards) as total_yellow_cards,
			SUM(mp.red_cards) as total_red_cards
		FROM match_players mp
		JOIN matches m ON mp.match_id = m.id
		WHERE EXTRACT(YEAR FROM m.date::date) = $1`,
		[currentYear]
	);

	return {
		year: currentYear,
		total_matches,
		total_goals: parseInt(statsResult.rows[0]?.total_goals || 0),
		total_assists: parseInt(statsResult.rows[0]?.total_assists || 0),
		total_yellow_cards: parseInt(statsResult.rows[0]?.total_yellow_cards || 0),
		total_red_cards: parseInt(statsResult.rows[0]?.total_red_cards || 0),
	};
}

export async function getCurrentYearMatchCount(): Promise<number> {
	const currentYear = new Date().getFullYear();
	const db = getDb();
	const result = await db.query(
		`SELECT COUNT(*) as count FROM matches WHERE EXTRACT(YEAR FROM date::date) = $1`,
		[currentYear]
	);
	return parseInt(result.rows[0]?.count || 0);
}

export async function getCurrentYearGoals(): Promise<number> {
	const currentYear = new Date().getFullYear();
	const db = getDb();
	const result = await db.query(
		`SELECT SUM(mp.goals) as total
		FROM match_players mp
		JOIN matches m ON mp.match_id = m.id
		WHERE EXTRACT(YEAR FROM m.date::date) = $1`,
		[currentYear]
	);
	return parseInt(result.rows[0]?.total || 0);
}

export async function getCurrentYearAssists(): Promise<number> {
	const currentYear = new Date().getFullYear();
	const db = getDb();
	const result = await db.query(
		`SELECT SUM(mp.assists) as total
		FROM match_players mp
		JOIN matches m ON mp.match_id = m.id
		WHERE EXTRACT(YEAR FROM m.date::date) = $1`,
		[currentYear]
	);
	return parseInt(result.rows[0]?.total || 0);
}

export async function getCurrentYearYellowCards(): Promise<number> {
	const currentYear = new Date().getFullYear();
	const db = getDb();
	const result = await db.query(
		`SELECT SUM(mp.yellow_cards) as total
		FROM match_players mp
		JOIN matches m ON mp.match_id = m.id
		WHERE EXTRACT(YEAR FROM m.date::date) = $1`,
		[currentYear]
	);
	return parseInt(result.rows[0]?.total || 0);
}

export async function getCurrentYearRedCards(): Promise<number> {
	const currentYear = new Date().getFullYear();
	const db = getDb();
	const result = await db.query(
		`SELECT SUM(mp.red_cards) as total
		FROM match_players mp
		JOIN matches m ON mp.match_id = m.id
		WHERE EXTRACT(YEAR FROM m.date::date) = $1`,
		[currentYear]
	);
	return parseInt(result.rows[0]?.total || 0);
}
