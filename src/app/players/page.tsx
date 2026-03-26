import AppShell from '@/components/app-shell';
import PlayersContent from '@/components/players/players-content';
import { fetchAllPlayers } from '@/lib/actions/players/player';

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
	const players = await fetchAllPlayers();

	return (
		<AppShell>
			<PlayersContent initialPlayers={players} />
		</AppShell>
	);
}
