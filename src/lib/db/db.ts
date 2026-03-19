import { getDbReady } from '../postgres';
import { getAllPlayers, getPlayer } from './players/player';
export type { PlayerWithAge } from './players/player';

export interface PlayerWithStats {
	id: number;
	name: string;
	last_name: string;
	dni: string;
	position: string | null;
	active: boolean;
	date_of_birth: string;
	created_at: string;
	attendance: number;
	category: string;
	age: number;
	total_goals: number;
	total_assists: number;
	total_yellow_cards: number;
	total_red_cards: number;
	total_minutes: number;
	matches_played: number;
}

export interface AnnualPlayerReport {
	player_id: number;
	player_name: string;
	years: {
		year: number;
		matches: number;
		goals: number;
		assists: number;
		yellow_cards: number;
		red_cards: number;
		minutes: number;
		goals_per_match: number;
		assists_per_match: number;
	}[];
}

export interface PlayerYearlyComparison {
	year: number;
	players: {
		id: number;
		name: string;
		goals: number;
		assists: number;
		matches: number;
		yellow_cards: number;
		red_cards: number;
		minutes: number;
		goals_per_match: number;
		assists_per_match: number;
	}[];
}

export async function getPlayerStats(playerId: number, year?: number) {
	const db = await getDbReady();
	if (year) {
		const result = await db.query(
			`SELECT
mp.goals,
mp.assists,
mp.yellow_cards,
mp.red_cards,
mp.minutes_played,
m.date as match_date
FROM match_players mp
JOIN matches m ON mp.match_id = m.id
WHERE mp.player_id = $1 AND EXTRACT(YEAR FROM m.date::date) = $2`,
			[playerId, year]
		);
		return result.rows;
	} else {
		const result = await db.query(
			`SELECT
mp.goals,
mp.assists,
mp.yellow_cards,
mp.red_cards,
mp.minutes_played,
m.date as match_date
FROM match_players mp
JOIN matches m ON mp.match_id = m.id
WHERE mp.player_id = $1`,
			[playerId]
		);
		return result.rows;
	}
}

export async function getPlayersWithStats(year?: number): Promise<PlayerWithStats[]> {
	const players = await getAllPlayers();

	return Promise.all(
		players.map(async (player) => {
			const stats = await getPlayerStats(player.id, year);
			return {
				...player,
				total_goals: stats.reduce((sum: number, s: any) => sum + s.goals, 0),
				total_assists: stats.reduce((sum: number, s: any) => sum + s.assists, 0),
				total_yellow_cards: stats.reduce((sum: number, s: any) => sum + s.yellow_cards, 0),
				total_red_cards: stats.reduce((sum: number, s: any) => sum + s.red_cards, 0),
				total_minutes: stats.reduce((sum: number, s: any) => sum + s.minutes_played, 0),
				matches_played: stats.length,
			};
		})
	);
}

export async function getTeamStats(year?: number) {
	const db = await getDbReady();

	const matchResult = year
		? await db.query(
				`SELECT COUNT(*) as count FROM matches WHERE EXTRACT(YEAR FROM date::date) = $1`,
				[year]
			)
		: await db.query(`SELECT COUNT(*) as count FROM matches`);
	const total_matches = parseInt(matchResult.rows[0]?.count || 0);

	const statsResult = year
		? await db.query(
				`SELECT mp.* FROM match_players mp JOIN matches m ON mp.match_id = m.id WHERE EXTRACT(YEAR FROM m.date::date) = $1`,
				[year]
			)
		: await db.query(`SELECT * FROM match_players`);
	const stats = statsResult.rows;

	const playerResult = await db.query(
		`SELECT COUNT(DISTINCT id) as count FROM players WHERE active = true`
	);
	const total_players = parseInt(playerResult.rows[0]?.count || 0);

	return {
		total_matches,
		total_goals: stats.reduce((sum: number, s: any) => sum + s.goals, 0),
		total_assists: stats.reduce((sum: number, s: any) => sum + s.assists, 0),
		total_yellow_cards: stats.reduce((sum: number, s: any) => sum + s.yellow_cards, 0),
		total_red_cards: stats.reduce((sum: number, s: any) => sum + s.red_cards, 0),
		total_minutes: stats.reduce((sum: number, s: any) => sum + s.minutes_played, 0),
		total_players,
	};
}

export async function getMonthlyStats(year: number) {
	const db = await getDbReady();
	const result = await db.query(
		`SELECT
EXTRACT(MONTH FROM m.date::date) as month,
SUM(mp.goals) as goals,
SUM(mp.assists) as assists,
SUM(mp.yellow_cards) as yellow_cards,
SUM(mp.red_cards) as red_cards,
SUM(mp.minutes_played) as minutes
FROM match_players mp
JOIN matches m ON mp.match_id = m.id
WHERE EXTRACT(YEAR FROM m.date::date) = $1
GROUP BY EXTRACT(MONTH FROM m.date::date)
ORDER BY month`,
		[year]
	);

	const monthNames = [
		'Ene',
		'Feb',
		'Mar',
		'Abr',
		'May',
		'Jun',
		'Jul',
		'Ago',
		'Sep',
		'Oct',
		'Nov',
		'Dic',
	];

	return result.rows.map((r: any) => ({
		month: parseInt(r.month),
		monthName: monthNames[parseInt(r.month) - 1],
		goals: parseInt(r.goals || 0),
		assists: parseInt(r.assists || 0),
		yellow_cards: parseInt(r.yellow_cards || 0),
		red_cards: parseInt(r.red_cards || 0),
		minutes: parseInt(r.minutes || 0),
	}));
}

export async function getPlayerAnnualReports(
	playerId?: number,
	year?: number
): Promise<AnnualPlayerReport[]> {
	const players = playerId
		? ([await getPlayer(playerId)].filter(Boolean) as Awaited<ReturnType<typeof getPlayer>>[])
		: await getAllPlayers();

	return Promise.all(
		(players as NonNullable<Awaited<ReturnType<typeof getPlayer>>>[]).map(async (player) => {
			const stats = await getPlayerStats(player.id, year);
			const yearMap = new Map<number, any>();

			stats.forEach((s: any) => {
				const y = new Date(s.match_date).getFullYear();
				if (!yearMap.has(y)) {
					yearMap.set(y, {
						year: y,
						matches: 0,
						goals: 0,
						assists: 0,
						yellow_cards: 0,
						red_cards: 0,
						minutes: 0,
					});
				}
				const entry = yearMap.get(y);
				entry.matches += 1;
				entry.goals += s.goals;
				entry.assists += s.assists;
				entry.yellow_cards += s.yellow_cards;
				entry.red_cards += s.red_cards;
				entry.minutes += s.minutes_played;
			});

			const years = Array.from(yearMap.values())
				.map((y) => ({
					...y,
					goals_per_match: y.matches > 0 ? +(y.goals / y.matches).toFixed(2) : 0,
					assists_per_match: y.matches > 0 ? +(y.assists / y.matches).toFixed(2) : 0,
				}))
				.sort((a, b) => b.year - a.year);

			return {
				player_id: player.id,
				player_name: `${player.name} ${player.last_name}`,
				years,
			};
		})
	);
}

export async function getPlayerComparison(playerIds: number[], year?: number) {
	return Promise.all(
		playerIds.map(async (id) => {
			const player = await getPlayer(id);
			if (!player) return null;

			const stats = await getPlayerStats(id, year);

			return {
				id: player.id,
				name: `${player.name} ${player.last_name}`,
				edad: player.age,
				matches: stats.length,
				goals: stats.reduce((sum: number, s: any) => sum + s.goals, 0),
				assists: stats.reduce((sum: number, s: any) => sum + s.assists, 0),
				yellow_cards: stats.reduce((sum: number, s: any) => sum + s.yellow_cards, 0),
				red_cards: stats.reduce((sum: number, s: any) => sum + s.red_cards, 0),
				minutes: stats.reduce((sum: number, s: any) => sum + s.minutes_played, 0),
				goals_per_match:
					stats.length > 0
						? +(stats.reduce((sum: number, s: any) => sum + s.goals, 0) / stats.length).toFixed(2)
						: 0,
				assists_per_match:
					stats.length > 0
						? +(stats.reduce((sum: number, s: any) => sum + s.assists, 0) / stats.length).toFixed(2)
						: 0,
			};
		})
	).then((results) => results.filter(Boolean));
}

export async function getPlayerYearlyComparison(
	playerIds: number[]
): Promise<PlayerYearlyComparison[]> {
	const allYears = new Set<number>();
	const playerData = (
		await Promise.all(
			playerIds.map(async (id) => {
				const player = await getPlayer(id);
				if (!player) return null;

				const stats = await getPlayerStats(id);
				const yearMap = new Map<number, any>();

				stats.forEach((s: any) => {
					const y = new Date(s.match_date).getFullYear();
					allYears.add(y);
					if (!yearMap.has(y)) {
						yearMap.set(y, {
							goals: 0,
							assists: 0,
							matches: 0,
							yellow_cards: 0,
							red_cards: 0,
							minutes: 0,
						});
					}
					const entry = yearMap.get(y);
					entry.goals += s.goals;
					entry.assists += s.assists;
					entry.matches += 1;
					entry.yellow_cards += s.yellow_cards;
					entry.red_cards += s.red_cards;
					entry.minutes += s.minutes_played;
				});

				return { id: player.id, name: `${player.name} ${player.last_name}`, yearMap };
			})
		)
	).filter(Boolean) as { id: number; name: string; yearMap: Map<number, any> }[];

	return Array.from(allYears)
		.sort((a, b) => a - b)
		.map((year) => ({
			year,
			players: playerData.map((pd) => {
				const d = pd.yearMap.get(year) || {
					goals: 0,
					assists: 0,
					matches: 0,
					yellow_cards: 0,
					red_cards: 0,
					minutes: 0,
				};
				return {
					id: pd.id,
					name: pd.name,
					...d,
					goals_per_match: d.matches > 0 ? +(d.goals / d.matches).toFixed(2) : 0,
					assists_per_match: d.matches > 0 ? +(d.assists / d.matches).toFixed(2) : 0,
				};
			}),
		}));
}

export async function getTopScorers(year?: number, limit: number = 5): Promise<PlayerWithStats[]> {
	const players = await getPlayersWithStats(year);
	return players
		.filter((p) => p.total_goals > 0)
		.sort((a, b) => b.total_goals - a.total_goals)
		.slice(0, limit);
}

export async function getTopAssisters(
	year?: number,
	limit: number = 5
): Promise<PlayerWithStats[]> {
	const players = await getPlayersWithStats(year);
	return players
		.filter((p) => p.total_assists > 0)
		.sort((a, b) => b.total_assists - a.total_assists)
		.slice(0, limit);
}
