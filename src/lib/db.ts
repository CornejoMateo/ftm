import { getDb } from './sqlite';

export interface Player {
	id: number;
	nombre: string;
	apellido: string;
	dni: string;
	posicion: string | null;
	activo: boolean;
	fecha_nacimiento: string;
	created_at: string;
}

export interface PlayerWithAge extends Player {
	edad: number;
}

export interface PlayerWithStats extends PlayerWithAge {
	total_goals: number;
	total_assists: number;
	total_yellow_cards: number;
	total_red_cards: number;
	total_minutes: number;
	matches_played: number;
}

export interface MatchStat {
	id: number;
	player_id: number;
	match_date: string;
	goals: number;
	assists: number;
	yellow_cards: number;
	red_cards: number;
	minutes_played: number;
	notes: string;
}

function calculateAge(birthDate: string): number {
	const today = new Date();
	const birth = new Date(birthDate);
	let age = today.getFullYear() - birth.getFullYear();
	const m = today.getMonth() - birth.getMonth();
	if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
		age--;
	}
	return age;
}

// Convertir resultado de SQLite a Player (convierte activo de INTEGER a boolean)
function rowToPlayer(row: any): Player {
	return {
		...row,
		activo: Boolean(row.activo),
	};
}

// Convertir Player a formato SQLite (convierte activo de boolean a INTEGER)
function playerToRow(player: Partial<Player>): any {
	const row: any = { ...player };
	if (typeof row.activo === 'boolean') {
		row.activo = row.activo ? 1 : 0;
	}
	return row;
}

// ============================================
// FUNCIONES CRUD - PLAYERS
// ============================================

export function getAllPlayers(): PlayerWithAge[] {
	const db = getDb();
	const stmt = db.prepare('SELECT * FROM players ORDER BY apellido, nombre');
	const rows = stmt.all();

	return rows.map((row: any) => {
		const player = rowToPlayer(row);
		return {
			...player,
			edad: calculateAge(player.fecha_nacimiento),
		};
	});
}

export function getPlayer(id: number): PlayerWithAge | undefined {
	const db = getDb();
	const stmt = db.prepare('SELECT * FROM players WHERE id = ?');
	const row = stmt.get(id) as any;

	if (!row) return undefined;

	const player = rowToPlayer(row);
	return {
		...player,
		edad: calculateAge(player.fecha_nacimiento),
	};
}

export function createPlayer(data: Omit<Player, 'id' | 'created_at'>): PlayerWithAge {
	const db = getDb();

	// Verificar si el DNI ya existe
	const checkStmt = db.prepare('SELECT id FROM players WHERE dni = ?');
	const existing = checkStmt.get(data.dni);

	if (existing) {
		throw new Error('Ya existe un jugador con este DNI');
	}

	// Insertar el nuevo jugador
	const rowData = playerToRow(data);
	const stmt = db.prepare(`
    INSERT INTO players (nombre, apellido, dni, posicion, activo, fecha_nacimiento)
    VALUES (@nombre, @apellido, @dni, @posicion, @activo, @fecha_nacimiento)
  `);

	const result = stmt.run(rowData);

	// Obtener el jugador recién creado
	const newPlayer = getPlayer(result.lastInsertRowid as number);

	if (!newPlayer) {
		throw new Error('Error al crear el jugador');
	}

	return newPlayer;
}

export function updatePlayer(
	id: number,
	data: Partial<Omit<Player, 'id' | 'created_at'>>
): PlayerWithAge {
	const db = getDb();

	// Verificar que el jugador existe
	const player = getPlayer(id);
	if (!player) {
		throw new Error('Jugador no encontrado');
	}

	// Verificar DNI duplicado si se está actualizando
	if (data.dni && data.dni !== player.dni) {
		const checkStmt = db.prepare('SELECT id FROM players WHERE dni = ? AND id != ?');
		const existing = checkStmt.get(data.dni, id);

		if (existing) {
			throw new Error('Ya existe un jugador con este DNI');
		}
	}

	// Construir la consulta de actualización dinámicamente
	const fields = Object.keys(data);
	if (fields.length === 0) {
		return player;
	}

	const rowData = playerToRow(data);
	const setClause = fields.map((field) => `${field} = @${field}`).join(', ');
	const stmt = db.prepare(`UPDATE players SET ${setClause} WHERE id = @id`);

	stmt.run({ ...rowData, id });

	// Devolver el jugador actualizado
	return getPlayer(id)!;
}

export function deletePlayer(id: number): void {
	const db = getDb();

	const stmt = db.prepare('DELETE FROM players WHERE id = ?');
	const result = stmt.run(id);

	if (result.changes === 0) {
		throw new Error('Jugador no encontrado');
	}
}

// ============================================
// DATOS TEMPORALES - Match Stats (en memoria por ahora)
// ============================================

let nextStatId = 31;

const matchStats: MatchStat[] = [
	// 2024 season matches
	{
		id: 1,
		player_id: 1,
		match_date: '2024-03-10',
		goals: 2,
		assists: 1,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 90,
		notes: 'Great performance',
	},
	{
		id: 2,
		player_id: 2,
		match_date: '2024-03-10',
		goals: 0,
		assists: 2,
		yellow_cards: 1,
		red_cards: 0,
		minutes_played: 85,
		notes: '',
	},
	{
		id: 3,
		player_id: 3,
		match_date: '2024-03-10',
		goals: 1,
		assists: 0,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 90,
		notes: '',
	},
	{
		id: 4,
		player_id: 1,
		match_date: '2024-04-14',
		goals: 1,
		assists: 0,
		yellow_cards: 1,
		red_cards: 0,
		minutes_played: 90,
		notes: '',
	},
	{
		id: 5,
		player_id: 2,
		match_date: '2024-04-14',
		goals: 1,
		assists: 1,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 90,
		notes: 'Solid game',
	},
	{
		id: 6,
		player_id: 4,
		match_date: '2024-04-14',
		goals: 0,
		assists: 0,
		yellow_cards: 0,
		red_cards: 1,
		minutes_played: 45,
		notes: 'Red card at half',
	},
	{
		id: 7,
		player_id: 5,
		match_date: '2024-04-14',
		goals: 0,
		assists: 1,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 70,
		notes: '',
	},
	{
		id: 8,
		player_id: 1,
		match_date: '2024-05-20',
		goals: 3,
		assists: 0,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 90,
		notes: 'Hat trick!',
	},
	{
		id: 9,
		player_id: 3,
		match_date: '2024-05-20',
		goals: 0,
		assists: 2,
		yellow_cards: 1,
		red_cards: 0,
		minutes_played: 80,
		notes: '',
	},
	{
		id: 10,
		player_id: 6,
		match_date: '2024-05-20',
		goals: 1,
		assists: 1,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 90,
		notes: '',
	},
	{
		id: 11,
		player_id: 7,
		match_date: '2024-06-15',
		goals: 2,
		assists: 0,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 90,
		notes: '',
	},
	{
		id: 12,
		player_id: 8,
		match_date: '2024-06-15',
		goals: 0,
		assists: 1,
		yellow_cards: 1,
		red_cards: 0,
		minutes_played: 75,
		notes: '',
	},
	{
		id: 13,
		player_id: 9,
		match_date: '2024-06-15',
		goals: 1,
		assists: 1,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 90,
		notes: '',
	},
	{
		id: 14,
		player_id: 10,
		match_date: '2024-06-15',
		goals: 0,
		assists: 0,
		yellow_cards: 2,
		red_cards: 0,
		minutes_played: 60,
		notes: '',
	},
	{
		id: 15,
		player_id: 1,
		match_date: '2024-07-20',
		goals: 1,
		assists: 2,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 90,
		notes: '',
	},
	{
		id: 16,
		player_id: 2,
		match_date: '2024-07-20',
		goals: 2,
		assists: 0,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 90,
		notes: '',
	},
	{
		id: 17,
		player_id: 5,
		match_date: '2024-07-20',
		goals: 0,
		assists: 1,
		yellow_cards: 1,
		red_cards: 0,
		minutes_played: 80,
		notes: '',
	},
	{
		id: 18,
		player_id: 1,
		match_date: '2024-09-10',
		goals: 0,
		assists: 1,
		yellow_cards: 1,
		red_cards: 0,
		minutes_played: 90,
		notes: '',
	},
	{
		id: 19,
		player_id: 3,
		match_date: '2024-09-10',
		goals: 2,
		assists: 0,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 90,
		notes: '',
	},
	{
		id: 20,
		player_id: 6,
		match_date: '2024-09-10',
		goals: 0,
		assists: 2,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 85,
		notes: '',
	},
	// 2025 season
	{
		id: 21,
		player_id: 1,
		match_date: '2025-01-15',
		goals: 2,
		assists: 1,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 90,
		notes: 'Season opener',
	},
	{
		id: 22,
		player_id: 2,
		match_date: '2025-01-15',
		goals: 1,
		assists: 0,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 90,
		notes: '',
	},
	{
		id: 23,
		player_id: 7,
		match_date: '2025-01-15',
		goals: 0,
		assists: 2,
		yellow_cards: 1,
		red_cards: 0,
		minutes_played: 85,
		notes: '',
	},
	{
		id: 24,
		player_id: 1,
		match_date: '2025-02-20',
		goals: 1,
		assists: 0,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 90,
		notes: '',
	},
	{
		id: 25,
		player_id: 4,
		match_date: '2025-02-20',
		goals: 2,
		assists: 1,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 90,
		notes: 'Comeback game',
	},
	{
		id: 26,
		player_id: 5,
		match_date: '2025-02-20',
		goals: 0,
		assists: 1,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 70,
		notes: '',
	},
	{
		id: 27,
		player_id: 8,
		match_date: '2025-03-15',
		goals: 1,
		assists: 0,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 90,
		notes: '',
	},
	{
		id: 28,
		player_id: 9,
		match_date: '2025-03-15',
		goals: 0,
		assists: 1,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 80,
		notes: '',
	},
	{
		id: 29,
		player_id: 10,
		match_date: '2025-03-15',
		goals: 1,
		assists: 1,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 90,
		notes: '',
	},
	{
		id: 30,
		player_id: 3,
		match_date: '2025-04-10',
		goals: 1,
		assists: 1,
		yellow_cards: 0,
		red_cards: 0,
		minutes_played: 90,
		notes: '',
	},
];

// ============================================
// Match Stats (temporales en memoria)
// ============================================

export function getPlayerStats(playerId: number): MatchStat[] {
	return matchStats
		.filter((s) => s.player_id === playerId)
		.sort((a, b) => b.match_date.localeCompare(a.match_date));
}

export function getAllStats(): (MatchStat & { player_name: string })[] {
	const players = getAllPlayers();

	return matchStats
		.map((s) => {
			const p = players.find((p) => p.id === s.player_id);
			return {
				...s,
				player_name: p ? `${p.nombre} ${p.apellido}` : 'Unknown',
			};
		})
		.sort((a, b) => b.match_date.localeCompare(a.match_date));
}

export function createMatchStat(data: Omit<MatchStat, 'id'>): MatchStat {
	const stat: MatchStat = { ...data, id: nextStatId++ };
	matchStats.push(stat);
	return stat;
}

export function updateMatchStat(id: number, data: Partial<Omit<MatchStat, 'id'>>): MatchStat {
	const idx = matchStats.findIndex((s) => s.id === id);
	if (idx === -1) throw new Error('Stat not found');
	matchStats[idx] = { ...matchStats[idx], ...data };
	return matchStats[idx];
}

export function deleteMatchStat(id: number): void {
	const idx = matchStats.findIndex((s) => s.id === id);
	if (idx === -1) throw new Error('Stat not found');
	matchStats.splice(idx, 1);
}

// ============================================
// Reports & Analytics
// ============================================

export function getPlayersWithStats(year?: number): PlayerWithStats[] {
	const players = getAllPlayers();

	return players.map((p) => {
		const stats = matchStats.filter((s) => {
			if (s.player_id !== p.id) return false;
			if (year) {
				const y = new Date(s.match_date).getFullYear();
				return y === year;
			}
			return true;
		});
		return {
			...p,
			total_goals: stats.reduce((sum, s) => sum + s.goals, 0),
			total_assists: stats.reduce((sum, s) => sum + s.assists, 0),
			total_yellow_cards: stats.reduce((sum, s) => sum + s.yellow_cards, 0),
			total_red_cards: stats.reduce((sum, s) => sum + s.red_cards, 0),
			total_minutes: stats.reduce((sum, s) => sum + s.minutes_played, 0),
			matches_played: stats.length,
		};
	});
}

export function getTeamStats(year?: number) {
	const filtered = year
		? matchStats.filter((s) => new Date(s.match_date).getFullYear() === year)
		: matchStats;

	const uniqueDates = new Set(filtered.map((s) => s.match_date));

	return {
		total_matches: uniqueDates.size,
		total_goals: filtered.reduce((sum, s) => sum + s.goals, 0),
		total_assists: filtered.reduce((sum, s) => sum + s.assists, 0),
		total_yellow_cards: filtered.reduce((sum, s) => sum + s.yellow_cards, 0),
		total_red_cards: filtered.reduce((sum, s) => sum + s.red_cards, 0),
		total_minutes: filtered.reduce((sum, s) => sum + s.minutes_played, 0),
		total_players: new Set(filtered.map((s) => s.player_id)).size,
	};
}

export function getMonthlyStats(year: number) {
	const months = Array.from({ length: 12 }, (_, i) => ({
		month: i + 1,
		monthName: new Date(year, i).toLocaleString('en', { month: 'short' }),
		goals: 0,
		assists: 0,
		yellow_cards: 0,
		red_cards: 0,
	}));

	matchStats
		.filter((s) => new Date(s.match_date).getFullYear() === year)
		.forEach((s) => {
			const m = new Date(s.match_date).getMonth();
			months[m].goals += s.goals;
			months[m].assists += s.assists;
			months[m].yellow_cards += s.yellow_cards;
			months[m].red_cards += s.red_cards;
		});

	return months;
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

export function getPlayerAnnualReports(playerId?: number): AnnualPlayerReport[] {
	const players = getAllPlayers();
	const targetPlayers = playerId ? players.filter((p) => p.id === playerId) : players;

	return targetPlayers
		.map((p) => {
			const playerStats = matchStats.filter((s) => s.player_id === p.id);

			// Group by year
			const yearMap = new Map<
				number,
				{
					goals: number;
					assists: number;
					yellow_cards: number;
					red_cards: number;
					minutes: number;
					matches: number;
				}
			>();

			for (const s of playerStats) {
				const y = new Date(s.match_date).getFullYear();
				if (!yearMap.has(y)) {
					yearMap.set(y, {
						goals: 0,
						assists: 0,
						yellow_cards: 0,
						red_cards: 0,
						minutes: 0,
						matches: 0,
					});
				}
				const entry = yearMap.get(y)!;
				entry.goals += s.goals;
				entry.assists += s.assists;
				entry.yellow_cards += s.yellow_cards;
				entry.red_cards += s.red_cards;
				entry.minutes += s.minutes_played;
				entry.matches += 1;
			}

			const years = Array.from(yearMap.entries())
				.sort(([a], [b]) => b - a)
				.map(([year, data]) => ({
					year,
					...data,
					goals_per_match: data.matches > 0 ? +(data.goals / data.matches).toFixed(2) : 0,
					assists_per_match: data.matches > 0 ? +(data.assists / data.matches).toFixed(2) : 0,
				}));

			return {
				player_id: p.id,
				player_name: `${p.nombre} ${p.apellido}`,
				years,
			};
		})
		.filter((r) => r.years.length > 0);
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

export function getPlayerYearlyComparison(playerIds: number[]): PlayerYearlyComparison[] {
	const players = getAllPlayers();
	const allYears = new Set<number>();
	const playerData = playerIds
		.map((id) => {
			const p = players.find((pl) => pl.id === id);
			if (!p) return null;
			const stats = matchStats.filter((s) => s.player_id === id);
			const yearMap = new Map<
				number,
				{
					goals: number;
					assists: number;
					matches: number;
					yellow_cards: number;
					red_cards: number;
					minutes: number;
				}
			>();
			for (const s of stats) {
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
				const entry = yearMap.get(y)!;
				entry.goals += s.goals;
				entry.assists += s.assists;
				entry.matches += 1;
				entry.yellow_cards += s.yellow_cards;
				entry.red_cards += s.red_cards;
				entry.minutes += s.minutes_played;
			}
			return { id: p.id, name: `${p.nombre} ${p.apellido}`, yearMap };
		})
		.filter(Boolean) as {
		id: number;
		name: string;
		yearMap: Map<
			number,
			{
				goals: number;
				assists: number;
				matches: number;
				yellow_cards: number;
				red_cards: number;
				minutes: number;
			}
		>;
	}[];

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

export function getPlayerComparison(playerIds: number[], year?: number) {
	const players = getAllPlayers();

	return playerIds
		.map((id) => {
			const p = players.find((p) => p.id === id);
			if (!p) return null;
			const stats = matchStats.filter((s) => {
				if (s.player_id !== id) return false;
				if (year) return new Date(s.match_date).getFullYear() === year;
				return true;
			});
			return {
				id: p.id,
				name: `${p.nombre} ${p.apellido}`,
				edad: p.edad,
				matches: stats.length,
				goals: stats.reduce((sum, s) => sum + s.goals, 0),
				assists: stats.reduce((sum, s) => sum + s.assists, 0),
				yellow_cards: stats.reduce((sum, s) => sum + s.yellow_cards, 0),
				red_cards: stats.reduce((sum, s) => sum + s.red_cards, 0),
				minutes: stats.reduce((sum, s) => sum + s.minutes_played, 0),
				goals_per_match:
					stats.length > 0
						? +(stats.reduce((sum, s) => sum + s.goals, 0) / stats.length).toFixed(2)
						: 0,
				assists_per_match:
					stats.length > 0
						? +(stats.reduce((sum, s) => sum + s.assists, 0) / stats.length).toFixed(2)
						: 0,
			};
		})
		.filter(Boolean);
}
