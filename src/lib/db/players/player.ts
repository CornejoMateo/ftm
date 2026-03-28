import { getDbReady } from '@/lib/postgres';

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

export function calculateAge(birthDate: string | Date): number {
	const today = new Date();
	const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;

	let age = today.getFullYear() - birth.getFullYear();
	const m = today.getMonth() - birth.getMonth();

	if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
		age--;
	}

	return age;
}

export async function getAllPlayers(): Promise<PlayerWithAge[]> {
	const db = await getDbReady();
	const result = await db.query('SELECT * FROM players ORDER BY last_name, name');
	return result.rows.map((row: any) => ({
		...row,
		age: calculateAge(row.date_of_birth),
	}));
}

export async function getActivePlayers(): Promise<PlayerWithAge[]> {
	const db = await getDbReady();
	const result = await db.query(
		'SELECT * FROM players WHERE active = true ORDER BY last_name, name'
	);
	return result.rows.map((row: any) => ({
		...row,
		age: calculateAge(row.date_of_birth),
	}));
}

export async function getPlayer(id: number): Promise<PlayerWithAge | undefined> {
	const db = await getDbReady();
	const result = await db.query('SELECT * FROM players WHERE id = $1', [id]);
	const row = result.rows[0];
	if (!row) return undefined;
	return { ...row, age: calculateAge(row.date_of_birth) };
}

export async function createPlayer(
	data: Omit<Player, 'id' | 'created_at'>
): Promise<PlayerWithAge> {
	const db = await getDbReady();

	if (data.dni) {
		const checkResult = await db.query('SELECT id FROM players WHERE dni = $1', [data.dni]);

		if (checkResult.rows.length > 0) {
			throw new Error('Ya existe un jugador con este DNI');
		}
	}

	const result = await db.query(
		`INSERT INTO players (name, last_name, dni, position, category, attendance, active, date_of_birth)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
		[
			data.name,
			data.last_name,
			data.dni,
			data.position,
			data.category,
			data.attendance,
			data.active,
			data.date_of_birth,
		]
	);

	const newPlayer = await getPlayer(result.rows[0].id);
	if (!newPlayer) {
		throw new Error('Error al crear el jugador');
	}
	return newPlayer;
}

export async function updatePlayer(
	id: number,
	data: Partial<Omit<Player, 'id' | 'created_at'>>
): Promise<PlayerWithAge> {
	const db = await getDbReady();

	const player = await getPlayer(id);
	if (!player) {
		throw new Error('Jugador no encontrado');
	}

	if (data.dni && data.dni !== player.dni) {
		const checkResult = await db.query('SELECT id FROM players WHERE dni = $1 AND id != $2', [
			data.dni,
			id,
		]);
		if (checkResult.rows.length > 0) {
			throw new Error('Ya existe un jugador con este DNI');
		}
	}

	const fields = Object.keys(data);
	if (fields.length === 0) {
		return player;
	}

	const values: any[] = fields.map((field) => data[field as keyof typeof data]);
	const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
	values.push(id);

	await db.query(`UPDATE players SET ${setClause} WHERE id = $${fields.length + 1}`, values);

	return (await getPlayer(id))!;
}

export async function deletePlayer(id: number): Promise<void> {
	const db = await getDbReady();
	const result = await db.query('DELETE FROM players WHERE id = $1', [id]);
	if (result.rowCount === 0) {
		throw new Error('Jugador no encontrado');
	}
}
