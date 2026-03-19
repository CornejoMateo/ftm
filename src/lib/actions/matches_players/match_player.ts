'use server';

import type { ActionResult } from '../types';
import { revalidatePath } from 'next/cache';

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
	getCurrentYearStats,
	getCurrentYearMatchCount,
	getCurrentYearGoals,
	getCurrentYearAssists,
	getCurrentYearYellowCards,
	getCurrentYearRedCards,
	type MatchPlayer,
	type MatchPlayerInput,
	type MatchPlayerWithMatchInfo,
} from '@/lib/db/matches_players/match_player';

export async function fetchPlayerMatchStats(playerId: number): Promise<MatchPlayerWithMatchInfo[]> {
	try {
		return await getMatchPlayersWithMatchInfo(playerId);
	} catch (error: any) {
		console.error('Error al obtener estadísticas de partidos del jugador:', error);
		throw error;
	}
}

// Match Players Actions

export async function fetchAllMatchPlayers() {
	try {
		return await getAllMatchPlayers();
	} catch (error: any) {
		console.error('Error al obtener relaciones partido-jugador:', error);
		throw error;
	}
}

export async function fetchMatchPlayersByMatch(matchId: number) {
	try {
		return await getMatchPlayersByMatch(matchId);
	} catch (error: any) {
		console.error('Error al obtener jugadores del partido:', error);
		throw error;
	}
}

export async function fetchMatchPlayersByPlayer(playerId: number) {
	try {
		return await getMatchPlayersByPlayer(playerId);
	} catch (error: any) {
		console.error('Error al obtener partidos del jugador:', error);
		throw error;
	}
}

export async function fetchMatchPlayer(id: number) {
	try {
		return await getMatchPlayer(id);
	} catch (error: any) {
		console.error('Error al obtener relación partido-jugador:', error);
		throw error;
	}
}

export async function fetchMatchPlayerByMatchAndPlayer(matchId: number, playerId: number) {
	try {
		return await getMatchPlayerByMatchAndPlayer(matchId, playerId);
	} catch (error: any) {
		console.error('Error al obtener relación partido-jugador:', error);
		throw error;
	}
}

export async function addMatchPlayer(data: MatchPlayerInput): Promise<ActionResult<MatchPlayer>> {
	try {
		const matchPlayer = await createMatchPlayer(data);
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
		const matchPlayer = await updateMatchPlayer(id, data);
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
		const matchPlayer = await getMatchPlayer(id);
		await deleteMatchPlayer(id);
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
		await deleteMatchPlayersByMatch(matchId);
		revalidatePath('/matchs');
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function removeMatchPlayersByPlayer(playerId: number): Promise<ActionResult> {
	try {
		await deleteMatchPlayersByPlayer(playerId);
		revalidatePath(`/players/${playerId}`);
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function fetchCurrentYearStats() {
	try {
		return await getCurrentYearStats();
	} catch (error: any) {
		console.error('Error al obtener estadísticas del año actual:', error);
		return {
			year: new Date().getFullYear(),
			total_matches: 0,
			total_goals: 0,
			total_assists: 0,
			total_yellow_cards: 0,
			total_red_cards: 0,
		};
	}
}

export async function fetchCurrentYearMatchCount(): Promise<number> {
	try {
		return await getCurrentYearMatchCount();
	} catch (error: any) {
		console.error('Error al obtener cantidad de partidos del año actual:', error);
		throw error;
	}
}

export async function fetchCurrentYearGoals(): Promise<number> {
	try {
		return await getCurrentYearGoals();
	} catch (error: any) {
		console.error('Error al obtener goles del año actual:', error);
		throw error;
	}
}

export async function fetchCurrentYearAssists(): Promise<number> {
	try {
		return await getCurrentYearAssists();
	} catch (error: any) {
		console.error('Error al obtener asistencias del año actual:', error);
		throw error;
	}
}

export async function fetchCurrentYearYellowCards(): Promise<number> {
	try {
		return await getCurrentYearYellowCards();
	} catch (error: any) {
		console.error('Error al obtener tarjetas amarillas del año actual:', error);
		throw error;
	}
}

export async function fetchCurrentYearRedCards(): Promise<number> {
	try {
		return await getCurrentYearRedCards();
	} catch (error: any) {
		console.error('Error al obtener tarjetas rojas del año actual:', error);
		throw error;
	}
}
