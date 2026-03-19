'use server';

import {
	getPlayersWithStats,
	getTeamStats,
	getMonthlyStats,
	getPlayerAnnualReports,
	getPlayerComparison,
	getPlayerYearlyComparison,
	getTopScorers,
	getTopAssisters,
	type PlayerWithStats,
	type AnnualPlayerReport,
	type PlayerYearlyComparison,
} from '../db/db';

import { getAvailableYears } from '../db/years/year';

export async function fetchPlayersWithStats(year?: number): Promise<PlayerWithStats[]> {
	try {
		return await getPlayersWithStats(year);
	} catch (error: any) {
		console.error('Error al obtener jugadores con estadísticas:', error);
		return [];
	}
}

export async function fetchTeamStats(year?: number) {
	try {
		return await getTeamStats(year);
	} catch (error: any) {
		console.error('Error al obtener estadísticas del equipo:', error);
		return null;
	}
}

export async function fetchMonthlyStats(year: number) {
	try {
		const [teamStats, monthlyStats, topScorers, topAssisters] = await Promise.all([
			getTeamStats(year),
			getMonthlyStats(year),
			getTopScorers(year, 5),
			getTopAssisters(year, 5),
		]);
		return { teamStats, monthlyStats, topScorers, topAssisters };
	} catch (error: any) {
		console.error('Error al obtener estadísticas mensuales:', error);
		return { teamStats: null, monthlyStats: [], topScorers: [], topAssisters: [] };
	}
}

export async function fetchPlayerAnnualReports(
	playerId?: number,
	year?: number
): Promise<AnnualPlayerReport[]> {
	try {
		return await getPlayerAnnualReports(playerId, year);
	} catch (error: any) {
		console.error('Error al obtener reportes anuales:', error);
		return [];
	}
}

export async function fetchPlayerComparison(playerIds: number[], year?: number) {
	try {
		return await getPlayerComparison(playerIds, year);
	} catch (error: any) {
		console.error('Error al comparar jugadores:', error);
		return [];
	}
}

export async function fetchPlayerYearlyComparison(
	playerIds: number[]
): Promise<PlayerYearlyComparison[]> {
	try {
		return await getPlayerYearlyComparison(playerIds);
	} catch (error: any) {
		console.error('Error al comparar jugadores por año:', error);
		return [];
	}
}

export async function fetchAvailableYears(): Promise<number[]> {
	try {
		return await getAvailableYears();
	} catch (error: any) {
		console.error('Error al obtener años disponibles:', error);
		return [];
	}
}

export async function fetchTopScorers(
	year?: number,
	limit: number = 5
): Promise<PlayerWithStats[]> {
	try {
		return await getTopScorers(year, limit);
	} catch (error: any) {
		console.error('Error al obtener top goleadores:', error);
		return [];
	}
}

export async function fetchTopAssisters(
	year?: number,
	limit: number = 5
): Promise<PlayerWithStats[]> {
	try {
		return await getTopAssisters(year, limit);
	} catch (error: any) {
		console.error('Error al obtener top asistentes:', error);
		return [];
	}
}
