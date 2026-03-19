'use server';

import type { ActionResult } from '../types';
import { revalidatePath } from 'next/cache';

import {
	getAllMatches,
	getMatch,
	getMatchesByYear,
	createMatch,
	updateMatch,
	deleteMatch,
	type Match,
	type MatchInput,
} from '@/lib/db/matches/match';

export async function fetchAllMatches() {
	try {
		return await getAllMatches();
	} catch (error: any) {
		console.error('Error al obtener partidos:', error);
		throw error;
	}
}

export async function fetchMatchesByYear(year: number) {
	try {
		return await getMatchesByYear(year);
	} catch (error: any) {
		console.error('Error al obtener partidos del año:', error);
		throw error;
	}
}

export async function fetchMatch(id: number) {
	try {
		return await getMatch(id);
	} catch (error: any) {
		console.error('Error al obtener partido:', error);
		throw error;
	}
}

export async function addMatch(data: MatchInput): Promise<ActionResult<Match>> {
	try {
		const match = await createMatch(data);
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
		const match = await updateMatch(id, data);
		revalidatePath('/matchs');
		revalidatePath('/');
		return { success: true, data: match };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function removeMatch(id: number): Promise<ActionResult> {
	try {
		await deleteMatch(id);
		revalidatePath('/matchs');
		revalidatePath('/');
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}
