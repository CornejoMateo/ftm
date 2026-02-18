'use server';

import {
	getAllPlayers,
	getPlayer,
	createPlayer,
	updatePlayer,
	deletePlayer,
	type Player,
	type PlayerWithAge,
} from './players/player';

import {
	getAllMatches,
	getMatch,
	getMatchesByYear,
	createMatch,
	updateMatch,
	deleteMatch,
	type Match,
	type MatchInput,
} from './matchs/match';

import { getPlayerStats, type MatchStat } from './db';

import { revalidatePath } from 'next/cache';

// response types
type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string };

export async function fetchAllPlayers() {
	try {
		return getAllPlayers();
	} catch (error: any) {
		console.error('Error al obtener jugadores:', error);
		throw error;
	}
}

export async function fetchPlayer(id: number) {
	try {
		return getPlayer(id);
	} catch (error: any) {
		console.error('Error al obtener jugador:', error);
		throw error;
	}
}

export async function addPlayer(
	data: Omit<Player, 'id' | 'created_at'>
): Promise<ActionResult<PlayerWithAge>> {
	try {
		const player = createPlayer(data);
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
		const player = updatePlayer(id, data);
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
		deletePlayer(id);
		revalidatePath('/players');
		revalidatePath('/');
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function fetchPlayerStats(playerId: number): Promise<MatchStat[]> {
	try {
		return getPlayerStats(playerId);
	} catch (error: any) {
		console.error('Error al obtener estadísticas del jugador:', error);
		return [];
	}
}

export async function fetchAllMatches() {
	try {
		return getAllMatches();
	} catch (error: any) {
		console.error('Error al obtener partidos:', error);
		throw error;
	}
}

export async function fetchMatchesByYear(year: number) {
	try {
		return getMatchesByYear(year);
	} catch (error: any) {
		console.error('Error al obtener partidos del año:', error);
		throw error;
	}
}

export async function fetchMatch(id: number) {
	try {
		return getMatch(id);
	} catch (error: any) {
		console.error('Error al obtener partido:', error);
		throw error;
	}
}

export async function addMatch(data: MatchInput): Promise<ActionResult<Match>> {
	try {
		const match = createMatch(data);
		revalidatePath('/matchs');
		revalidatePath('/');
		return { success: true, data: match };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function editMatch(
	id: number,
	data: Partial<MatchInput>
): Promise<ActionResult<Match>> {
	try {
		const match = updateMatch(id, data);
		revalidatePath('/matchs');
		revalidatePath('/');
		return { success: true, data: match };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function removeMatch(id: number): Promise<ActionResult> {
	try {
		deleteMatch(id);
		revalidatePath('/matchs');
		revalidatePath('/');
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}
