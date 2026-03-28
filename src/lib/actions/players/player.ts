'use server';

import type { ActionResult } from '../types';
import { revalidatePath } from 'next/cache';

import {
	getAllPlayers,
	getPlayer,
	createPlayer,
	updatePlayer,
	deletePlayer,
	type Player,
	type PlayerWithAge,
} from '@/lib/db/players/player';

export async function fetchAllPlayers() {
	try {
		return await getAllPlayers();
	} catch (error: any) {
		console.error('Error al obtener jugadores:', error);
		throw error;
	}
}

export async function fetchPlayer(id: number) {
	if (!Number.isInteger(id) || id <= 0) {
		return undefined;
	}

	try {
		return await getPlayer(id);
	} catch (error: any) {
		console.error('Error al obtener jugador:', error);
		throw error;
	}
}

export async function addPlayer(
	data: Omit<Player, 'id' | 'created_at'>
): Promise<ActionResult<PlayerWithAge>> {
	try {
		const player = await createPlayer(data);
		revalidatePath('/players');
		revalidatePath('/');
		return { success: true, data: player };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function editPlayer(
	id: number,
	data: Partial<Omit<Player, 'id' | 'created_at'>>
): Promise<ActionResult<PlayerWithAge>> {
	try {
		const player = await updatePlayer(id, data);
		revalidatePath('/players');
		revalidatePath('/');
		revalidatePath(`/players/${id}`);
		return { success: true, data: player };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function removePlayer(id: number): Promise<ActionResult> {
	try {
		await deletePlayer(id);
		revalidatePath('/players');
		revalidatePath('/');
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}
