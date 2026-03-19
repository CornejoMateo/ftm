import AppShell from '@/components/app-shell';
import MatchsContent from '@/components/matchs-content';

export const dynamic = 'force-dynamic';

export default function MatchsPage() {
	return (
		<AppShell>
			<MatchsContent />
		</AppShell>
	);
}
