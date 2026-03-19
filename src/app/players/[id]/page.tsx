import AppShell from '@/components/app-shell';
import PlayerProfile from '@/components/player-profile';
import { fetchPlayer } from '@/lib/actions/players/player';
import { fetchPlayerMatchStats } from '@/lib/actions/matches_players/match_player';

export const dynamic = 'force-dynamic';

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
