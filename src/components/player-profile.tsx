'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Target, HandHelping, AlertTriangle, Timer, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchPlayer, fetchPlayerStats } from '@/lib/actions';
import type { PlayerWithAge } from '@/lib/players/player';
import type { MatchStat } from '@/lib/db';

export default function PlayerProfile() {
	const params = useParams();
	const router = useRouter();
	const playerId = Number(params.id);
	const [player, setPlayer] = useState<PlayerWithAge | null>(null);
	const [stats, setStats] = useState<MatchStat[]>([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		setLoading(true);
		const [p, s] = await Promise.all([fetchPlayer(playerId), fetchPlayerStats(playerId)]);
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
		{ title: 'Partidos', value: totals.matches, icon: Trophy, color: 'text-primary' },
		{ title: 'Goles', value: totals.goals, icon: Target, color: 'text-chart-1' },
		{ title: 'Asistencias', value: totals.assists, icon: HandHelping, color: 'text-chart-2' },
		{
			title: 'Tarjetas amarillas',
			value: totals.yellow_cards,
			icon: AlertTriangle,
			color: 'text-chart-3',
		},
		{
			title: 'Minutos',
			value: totals.minutes.toLocaleString(),
			icon: Timer,
			color: 'text-chart-5',
		},
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
			<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
				{summaryCards.map((card) => (
					<Card key={card.title}>
						<CardContent className="flex flex-col gap-1 p-4">
							<div className="flex items-center gap-2">
								<card.icon className={`h-4 w-4 ${card.color}`} />
								<span className="text-xs text-muted-foreground">{card.title}</span>
							</div>
							<p className="text-2xl font-bold text-card-foreground">{card.value}</p>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
