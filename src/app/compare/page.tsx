import AppShell from '@/components/app-shell';
import CompareContent from '@/components/compare-content';

export const dynamic = 'force-dynamic';

export default function ComparePage() {
	return (
		<AppShell>
			<CompareContent />
		</AppShell>
	);
}
