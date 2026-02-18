import { getDb } from '../sqlite';

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

function rowToMatchPlayer(row: any): MatchPlayer {
	return {
		...row,
		starter: Boolean(row.starter),
		minute_login: row.minute_login ?? null,
		calification: row.calification ?? null,
	};
}

function matchPlayerToRow(matchPlayer: Partial<MatchPlayer>): any {
	const row: any = { ...matchPlayer };
	if (typeof row.starter === 'boolean') {
		row.starter = row.starter ? 1 : 0;
	}
	return row;
}

export function getAllMatchPlayers(): MatchPlayer[] {
	const db = getDb();
	const stmt = db.prepare('SELECT * FROM match_players ORDER BY created_at DESC');
	const rows = stmt.all();

	return rows.map((row: any) => rowToMatchPlayer(row));
}

export function getMatchPlayerByYear(year: number): MatchPlayer[] {
	const db = getDb();
	const stmt = db.prepare(`
        SELECT mp.* FROM match_players mp
        JOIN matches m ON mp.match_id = m.id
        WHERE strftime('%Y', m.date) = ?
        ORDER BY mp.created_at DESC
    `);
	const rows = stmt.all(year.toString());

	return rows.map((row: any) => rowToMatchPlayer(row));
}

export function getMatchPlayersByMatch(matchId: number): MatchPlayer[] {
	const db = getDb();
	const stmt = db.prepare('SELECT * FROM match_players WHERE match_id = ?');
	const rows = stmt.all(matchId);

	return rows.map((row: any) => rowToMatchPlayer(row));
}

export function getMatchPlayersByPlayer(playerId: number): MatchPlayer[] {
	const db = getDb();
	const stmt = db.prepare(
		'SELECT * FROM match_players WHERE player_id = ? ORDER BY created_at DESC'
	);
	const rows = stmt.all(playerId);

	return rows.map((row: any) => rowToMatchPlayer(row));
}

export function getMatchPlayersWithMatchInfo(playerId: number): MatchPlayerWithMatchInfo[] {
	const db = getDb();
	const stmt = db.prepare(`
		SELECT 
			mp.*,
			m.date as match_date,
			m.opponent as match_opponent,
			m.result as match_result,
			m.home as match_home
		FROM match_players mp
		JOIN matches m ON mp.match_id = m.id
		WHERE mp.player_id = ?
		ORDER BY m.date DESC
	`);
	const rows = stmt.all(playerId);

	return rows.map((row: any) => ({
		...rowToMatchPlayer(row),
		match_date: row.match_date,
		match_opponent: row.match_opponent,
		match_result: row.match_result,
		match_home: Boolean(row.match_home),
	}));
}

export function getMatchPlayer(id: number): MatchPlayer | undefined {
	const db = getDb();
	const stmt = db.prepare('SELECT * FROM match_players WHERE id = ?');
	const row = stmt.get(id) as any;

	if (!row) return undefined;

	return rowToMatchPlayer(row);
}

export function getMatchPlayerByMatchAndPlayer(
	matchId: number,
	playerId: number
): MatchPlayer | undefined {
	const db = getDb();
	const stmt = db.prepare('SELECT * FROM match_players WHERE match_id = ? AND player_id = ?');
	const row = stmt.get(matchId, playerId) as any;

	if (!row) return undefined;

	return rowToMatchPlayer(row);
}

export function createMatchPlayer(data: MatchPlayerInput): MatchPlayer {
	const db = getDb();

	const rowData = matchPlayerToRow(data);
	const stmt = db.prepare(`
		INSERT INTO match_players (
			match_id, player_id, minutes_played, goals, assists,
			yellow_cards, red_cards, starter, minute_login, calification
		)
		VALUES (
			@match_id, @player_id, @minutes_played, @goals, @assists,
			@yellow_cards, @red_cards, @starter, @minute_login, @calification
		)
	`);

	const result = stmt.run(rowData);

	const newMatchPlayer = getMatchPlayer(result.lastInsertRowid as number);

	if (!newMatchPlayer) {
		throw new Error('Error al crear la relación partido-jugador');
	}

	return newMatchPlayer;
}

export function updateMatchPlayer(id: number, data: Partial<MatchPlayerInput>): MatchPlayer {
	const db = getDb();

	const matchPlayer = getMatchPlayer(id);
	if (!matchPlayer) {
		throw new Error('Relación partido-jugador no encontrada');
	}

	const fields = Object.keys(data);
	if (fields.length === 0) {
		return matchPlayer;
	}

	const rowData = matchPlayerToRow(data);
	const setClause = fields.map((field) => `${field} = @${field}`).join(', ');
	const stmt = db.prepare(`UPDATE match_players SET ${setClause} WHERE id = @id`);

	stmt.run({ ...rowData, id });

	return getMatchPlayer(id)!;
}

export function deleteMatchPlayer(id: number): void {
	const db = getDb();

	const stmt = db.prepare('DELETE FROM match_players WHERE id = ?');
	const result = stmt.run(id);

	if (result.changes === 0) {
		throw new Error('Relación partido-jugador no encontrada');
	}
}

export function deleteMatchPlayersByMatch(matchId: number): void {
	const db = getDb();

	const stmt = db.prepare('DELETE FROM match_players WHERE match_id = ?');
	stmt.run(matchId);
}

export function deleteMatchPlayersByPlayer(playerId: number): void {
	const db = getDb();

	const stmt = db.prepare('DELETE FROM match_players WHERE player_id = ?');
	stmt.run(playerId);
}
