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

import {
	getAllMatchPlayers,
	getMatchPlayersByMatch,
	getMatchPlayersByPlayer,
	getMatchPlayer,
	getMatchPlayerByMatchAndPlayer,
	getMatchPlayersWithMatchInfo,
	createMatchPlayer,
	updateMatchPlayer,
	deleteMatchPlayer,
	deleteMatchPlayersByMatch,
	deleteMatchPlayersByPlayer,
	type MatchPlayer,
	type MatchPlayerInput,
	type MatchPlayerWithMatchInfo,
} from './matchs_players/match_player';

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

export async function fetchPlayerMatchStats(playerId: number): Promise<MatchPlayerWithMatchInfo[]> {
	try {
		return getMatchPlayersWithMatchInfo(playerId);
	} catch (error: any) {
		console.error('Error al obtener estadísticas de partidos del jugador:', error);
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

// Match Players Actions

export async function fetchAllMatchPlayers() {
	try {
		return getAllMatchPlayers();
	} catch (error: any) {
		console.error('Error al obtener relaciones partido-jugador:', error);
		throw error;
	}
}

export async function fetchMatchPlayersByMatch(matchId: number) {
	try {
		return getMatchPlayersByMatch(matchId);
	} catch (error: any) {
		console.error('Error al obtener jugadores del partido:', error);
		throw error;
	}
}

export async function fetchMatchPlayersByPlayer(playerId: number) {
	try {
		return getMatchPlayersByPlayer(playerId);
	} catch (error: any) {
		console.error('Error al obtener partidos del jugador:', error);
		throw error;
	}
}

export async function fetchMatchPlayer(id: number) {
	try {
		return getMatchPlayer(id);
	} catch (error: any) {
		console.error('Error al obtener relación partido-jugador:', error);
		throw error;
	}
}

export async function fetchMatchPlayerByMatchAndPlayer(matchId: number, playerId: number) {
	try {
		return getMatchPlayerByMatchAndPlayer(matchId, playerId);
	} catch (error: any) {
		console.error('Error al obtener relación partido-jugador:', error);
		throw error;
	}
}

export async function addMatchPlayer(data: MatchPlayerInput): Promise<ActionResult<MatchPlayer>> {
	try {
		const matchPlayer = createMatchPlayer(data);
		revalidatePath('/matchs');
		revalidatePath(`/players/${data.player_id}`);
		return { success: true, data: matchPlayer };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function editMatchPlayer(
	id: number,
	data: Partial<MatchPlayerInput>
): Promise<ActionResult<MatchPlayer>> {
	try {
		const matchPlayer = updateMatchPlayer(id, data);
		revalidatePath('/matchs');
		if (matchPlayer.player_id) {
			revalidatePath(`/players/${matchPlayer.player_id}`);
		}
		return { success: true, data: matchPlayer };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function removeMatchPlayer(id: number): Promise<ActionResult> {
	try {
		const matchPlayer = getMatchPlayer(id);
		deleteMatchPlayer(id);
		revalidatePath('/matchs');
		if (matchPlayer) {
			revalidatePath(`/players/${matchPlayer.player_id}`);
		}
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function removeMatchPlayersByMatch(matchId: number): Promise<ActionResult> {
	try {
		deleteMatchPlayersByMatch(matchId);
		revalidatePath('/matchs');
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function removeMatchPlayersByPlayer(playerId: number): Promise<ActionResult> {
	try {
		deleteMatchPlayersByPlayer(playerId);
		revalidatePath(`/players/${playerId}`);
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}
