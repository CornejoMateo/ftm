import { initializeDatabase } from '@/lib/postgres';

export async function startup() {
	await initializeDatabase();
}
