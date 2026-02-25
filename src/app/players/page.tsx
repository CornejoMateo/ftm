import AppShell from '@/components/app-shell';
import PlayersContent from '@/components/players-content';
import { fetchAllPlayers } from '@/lib/actions';

export default async function PlayersPage() {
	const players = await fetchAllPlayers();

	return (
		<AppShell>
			<PlayersContent initialPlayers={players} />
		</AppShell>
	);
}
