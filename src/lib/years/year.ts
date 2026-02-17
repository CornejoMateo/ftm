import { getDb } from '../sqlite';

export interface Year {
	years: number[];
}

export function getAvailableYears(): number[] {
	return [2026];
}

export async function fetchAvailableYears(): Promise<number[]> {
	try {
		return getAvailableYears();
	} catch (error: any) {
		console.error('Error al obtener años disponibles:', error);
		return [];
	}
}
