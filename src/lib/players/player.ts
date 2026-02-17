import { getDb } from '../sqlite';

export interface Player {
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
}

export interface PlayerWithAge extends Player {
	age: number;
}

export function calculateAge(birthDate: string): number {
	const today = new Date();
	const birth = new Date(birthDate);
	let age = today.getFullYear() - birth.getFullYear();
	const m = today.getMonth() - birth.getMonth();
	if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
		age--;
	}
	return age;
}

function rowToPlayer(row: any): Player {
	return {
		...row,
		active: Boolean(row.active),
	};
}

function playerToRow(player: Partial<Player>): any {
	const row: any = { ...player };
	if (typeof row.active === 'boolean') {
		row.active = row.active ? 1 : 0;
	}
	return row;
}

export function getAllPlayers(): PlayerWithAge[] {
	const db = getDb();
	const stmt = db.prepare('SELECT * FROM players ORDER BY last_name, name');
	const rows = stmt.all();

	return rows.map((row: any) => {
		const player = rowToPlayer(row);
		return {
			...player,
			age: calculateAge(player.date_of_birth),
		};
	});
}

export function getActivePlayers(): PlayerWithAge[] {
	const db = getDb();
	const stmt = db.prepare('SELECT * FROM players WHERE active = 1 ORDER BY last_name, name');
	const rows = stmt.all();

	return rows.map((row: any) => {
		const player = rowToPlayer(row);
		return {
			...player,
			age: calculateAge(player.date_of_birth),
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
		age: calculateAge(player.date_of_birth),
	};
}

export function createPlayer(data: Omit<Player, 'id' | 'created_at'>): PlayerWithAge {
	const db = getDb();

	const checkStmt = db.prepare('SELECT id FROM players WHERE dni = ?');
	const existing = checkStmt.get(data.dni);

	if (existing) {
		throw new Error('Ya existe un jugador con este DNI');
	}

	// insert the new player
	const rowData = playerToRow(data);
	const stmt = db.prepare(`
    INSERT INTO players (name, last_name, dni, position, category, attendance, active, date_of_birth)
    VALUES (@name, @last_name, @dni, @position, @category, @attendance, @active, @date_of_birth)
  `);

	const result = stmt.run(rowData);

	// Get the newly created player
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

	// verify that the player exists
	const player = getPlayer(id);
	if (!player) {
		throw new Error('Jugador no encontrado');
	}

	// verify that the new DNI (if provided) is unique
	if (data.dni && data.dni !== player.dni) {
		const checkStmt = db.prepare('SELECT id FROM players WHERE dni = ? AND id != ?');
		const existing = checkStmt.get(data.dni, id);

		if (existing) {
			throw new Error('Ya existe un jugador con este DNI');
		}
	}

	const fields = Object.keys(data);
	if (fields.length === 0) {
		return player;
	}

	const rowData = playerToRow(data);
	const setClause = fields.map((field) => `${field} = @${field}`).join(', ');
	const stmt = db.prepare(`UPDATE players SET ${setClause} WHERE id = @id`);

	stmt.run({ ...rowData, id });

	// Return the updated player
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
