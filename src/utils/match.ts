export function getMatchResultType(
	result: string,
	home: boolean
): 'win' | 'draw' | 'loss' | 'unknown' {
	const match = result.match(/(\d+)\s*-\s*(\d+)/);
	if (!match) return 'unknown';

	const homeGoals = parseInt(match[1], 10);
	const awayGoals = parseInt(match[2], 10);

	const ourGoals = home ? homeGoals : awayGoals;
	const theirGoals = home ? awayGoals : homeGoals;

	if (ourGoals > theirGoals) return 'win';
	if (ourGoals === theirGoals) return 'draw';
	return 'loss';
}

export function getResultColor(resultType: 'win' | 'draw' | 'loss' | 'unknown'): string {
	switch (resultType) {
		case 'win':
			return 'bg-green-600 text-white border-green-600';
		case 'draw':
			return 'bg-yellow-500 text-white border-yellow-500';
		case 'loss':
			return 'bg-red-600 text-white border-red-600';
		default:
			return '';
	}
}
