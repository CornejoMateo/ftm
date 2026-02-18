'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
	ArrowLeft,
	Target,
	HandHelping,
	AlertTriangle,
	Timer,
	Trophy,
	Shield,
	Users,
	TrendingUp,
	Award,
	Flame,
	Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fetchPlayer, fetchPlayerMatchStats } from '@/lib/actions';
import type { PlayerWithAge } from '@/lib/players/player';
import type { MatchPlayerWithMatchInfo } from '@/lib/matchs_players/match_player';

export default function PlayerProfile() {
	const params = useParams();
	const router = useRouter();
	const playerId = Number(params.id);
	const [player, setPlayer] = useState<PlayerWithAge | null>(null);
	const [stats, setStats] = useState<MatchPlayerWithMatchInfo[]>([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		setLoading(true);
		const [p, s] = await Promise.all([fetchPlayer(playerId), fetchPlayerMatchStats(playerId)]);
		setPlayer(p || null);
		setStats(s);
		setLoading(false);
	}, [playerId]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	if (!player) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 py-20">
				<p className="text-muted-foreground">No se pudo cargar el jugador</p>
				<Button variant="outline" onClick={() => router.push('/players')}>
					Volver atrás
				</Button>
			</div>
		);
	}

	const totals = {
		goals: stats.reduce((s, m) => s + m.goals, 0),
		assists: stats.reduce((s, m) => s + m.assists, 0),
		yellow_cards: stats.reduce((s, m) => s + m.yellow_cards, 0),
		red_cards: stats.reduce((s, m) => s + m.red_cards, 0),
		minutes: stats.reduce((s, m) => s + m.minutes_played, 0),
		matches: stats.length,
	};

	// Calculate starter vs substitute matches
	const starterMatches = stats.filter((s) => s.starter).length;
	const substituteMatches = stats.filter((s) => !s.starter).length;

	// Opponents with most goals
	const goalsByOpponent = new Map<string, number>();
	for (const s of stats) {
		if (s.goals > 0) {
			goalsByOpponent.set(s.match_opponent, (goalsByOpponent.get(s.match_opponent) || 0) + s.goals);
		}
	}
	const favoriteOpponent =
		goalsByOpponent.size > 0
			? Array.from(goalsByOpponent.entries()).sort((a, b) => b[1] - a[1])[0]
			: null;

	// AVG goals and minutes
	const avgGoals = totals.matches > 0 ? (totals.goals / totals.matches).toFixed(2) : '0.00';
	const avgMinutes = totals.matches > 0 ? Math.round(totals.minutes / totals.matches) : 0;

	// Most goals in a single match
	const bestMatch =
		stats.length > 0
			? stats.reduce((best, current) => (current.goals > best.goals ? current : best), stats[0])
			: null;

	// Longest scoring streak
	let currentStreak = 0;
	let maxStreak = 0;
	for (const s of stats) {
		if (s.goals > 0) {
			currentStreak++;
			maxStreak = Math.max(maxStreak, currentStreak);
		} else {
			currentStreak = 0;
		}
	}

	// Calification stats
	const statsWithCalification = stats.filter((s) => s.calification !== null);
	const bestCalification =
		statsWithCalification.length > 0
			? statsWithCalification.reduce((best, current) =>
					current.calification! > best.calification! ? current : best
				)
			: null;
	const avgCalification =
		statsWithCalification.length > 0
			? (
					statsWithCalification.reduce((sum, s) => sum + s.calification!, 0) /
					statsWithCalification.length
				).toFixed(2)
			: null;

	// Group stats by month for chart
	const monthlyMap = new Map<string, { month: string; goals: number; assists: number }>();
	for (const s of stats) {
		const d = new Date(s.match_date);
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		const label = d.toLocaleString('en', { month: 'short', year: '2-digit' });
		if (!monthlyMap.has(key)) {
			monthlyMap.set(key, { month: label, goals: 0, assists: 0 });
		}
		const entry = monthlyMap.get(key)!;
		entry.goals += s.goals;
		entry.assists += s.assists;
	}
	const chartData = Array.from(monthlyMap.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([, v]) => v);

	const summaryCards = [
		{ title: 'Partidos jugados', value: totals.matches, icon: Trophy, color: 'text-primary' },
		{ title: 'Como titular', value: starterMatches, icon: Shield, color: 'text-blue-500' },
		{ title: 'Como suplente', value: substituteMatches, icon: Users, color: 'text-purple-500' },
		{ title: 'Goles', value: totals.goals, icon: Target, color: 'text-chart-1' },
		{ title: 'Promedio goles', value: avgGoals, icon: TrendingUp, color: 'text-green-500' },
		{ title: 'Asistencias', value: totals.assists, icon: HandHelping, color: 'text-chart-2' },
		{
			title: 'Tarjetas amarillas',
			value: totals.yellow_cards,
			icon: AlertTriangle,
			color: 'text-yellow-500',
		},
		{
			title: 'Tarjetas rojas',
			value: totals.red_cards,
			icon: AlertTriangle,
			color: 'text-red-500',
		},
		{
			title: 'Minutos jugados',
			value: totals.minutes.toLocaleString(),
			icon: Timer,
			color: 'text-chart-5',
		},
		{ title: 'Promedio minutos', value: avgMinutes, icon: Timer, color: 'text-slate-500' },
		...(bestMatch && bestMatch.goals > 0
			? [
					{
						title: 'Mejor partido',
						value: `${bestMatch.goals} gol${bestMatch.goals > 1 ? 'es' : ''} vs ${bestMatch.match_opponent}`,
						icon: Award,
						color: 'text-amber-500',
					},
				]
			: []),
		...(maxStreak > 0
			? [
					{
						title: 'Racha de goles',
						value: `${maxStreak} partido${maxStreak > 1 ? 's' : ''}`,
						icon: Flame,
						color: 'text-orange-500',
					},
				]
			: []),
		...(favoriteOpponent
			? [
					{
						title: 'Rival favorito',
						value: `${favoriteOpponent[0]} (${favoriteOpponent[1]} gol${favoriteOpponent[1] > 1 ? 'es' : ''})`,
						icon: Target,
						color: 'text-pink-500',
					},
				]
			: []),
		...(avgCalification
			? [
					{
						title: 'Calificación promedio',
						value: avgCalification,
						icon: Star,
						color: 'text-yellow-600',
					},
				]
			: []),
		...(bestCalification
			? [
					{
						title: 'Mejor calificación',
						value: `${bestCalification.calification} vs ${bestCalification.match_opponent}`,
						icon: Star,
						color: 'text-yellow-500',
					},
				]
			: []),
	];

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" onClick={() => router.push('/players')}>
					<ArrowLeft className="h-5 w-5" />
					<span className="sr-only">Volver a jugadores</span>
				</Button>
				<div>
					<h3 className="text-2xl font-bold text-foreground">
						{player.name} {player.last_name}
					</h3>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<span>DNI: {player.dni}</span>
						<span>|</span>
						<span>Edad: {player.age} años</span>
						<span>|</span>
						<span>Nacimiento: {player.date_of_birth}</span>
						{player.position && (
							<>
								<span>|</span>
								<span>Posición: {player.position}</span>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Summary cards */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
				{summaryCards.map((card) => (
					<Card key={card.title}>
						<CardContent className="flex flex-col gap-1 p-4">
							<div className="flex items-center gap-2">
								<card.icon className={`h-4 w-4 ${card.color}`} />
								<span className="text-xs text-muted-foreground">{card.title}</span>
							</div>
							<p className="text-lg font-bold text-card-foreground">{card.value}</p>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
