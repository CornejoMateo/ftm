import AppShell from '@/components/app-shell';
import PlayerProfile from '@/components/player-profile';
import { fetchPlayer, fetchPlayerMatchStats } from '@/lib/actions';

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	const playerId = Number(id);

	const [player, stats] = await Promise.all([
		fetchPlayer(playerId),
		fetchPlayerMatchStats(playerId),
	]);

	return (
		<AppShell>
			<PlayerProfile player={player || null} initialStats={stats} />
		</AppShell>
	);
}
