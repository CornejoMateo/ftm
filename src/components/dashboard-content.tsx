'use client';

import { useEffect, useState } from 'react';
import { Users, Target, HandHelping, AlertTriangle, Timer, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useYear } from '@/contexts/year-context';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
} from 'recharts';
import type { PlayerWithStats } from '@/lib/db';

interface TeamStats {
	total_matches: number;
	total_goals: number;
	total_assists: number;
	total_yellow_cards: number;
	total_red_cards: number;
	total_minutes: number;
	total_players: number;
}

interface MonthlyData {
	month: number;
	monthName: string;
	goals: number;
	assists: number;
	yellow_cards: number;
	red_cards: number;
}

export default function DashboardContent() {
	const { selectedYear } = useYear();
	const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
	const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
	const [topScorers, setTopScorers] = useState<PlayerWithStats[]>([]);
	const [loading, setLoading] = useState(true);

	if (loading || !teamStats) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	const statCards = [
		{
			title: 'Cantidad de partidos',
			value: teamStats.total_matches,
			icon: Trophy,
			color: 'text-primary',
		},
		{
			title: 'Cantidad de jugadores',
			value: teamStats.total_players,
			icon: Users,
			color: 'text-chart-2',
		},
		{
			title: 'Goles marcados',
			value: teamStats.total_goals,
			icon: Target,
			color: 'text-chart-3',
		},
		{
			title: 'Total asistencias',
			value: teamStats.total_assists,
			icon: HandHelping,
			color: 'text-chart-1',
		},
		{
			title: 'Tarjetas amarillas',
			value: teamStats.total_yellow_cards,
			icon: AlertTriangle,
			color: 'text-chart-3',
		},
		{
			title: 'Minutos jugados',
			value: teamStats.total_minutes.toLocaleString(),
			icon: Timer,
			color: 'text-chart-5',
		},
	];

	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div className="flex flex-col gap-3">
				<div>
					<h3 className="text-xl font-bold text-foreground sm:text-2xl">Resumen del equipo</h3>
					<p className="text-xs text-muted-foreground sm:text-sm">
						Algunas estadísticas clave de tu equipo{' '}
						{selectedYear ? `en ${selectedYear}` : 'de todos los años'}
					</p>
				</div>
			</div>

			{/* Stat cards */}
			<div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
				{statCards.map((stat) => (
					<Card key={stat.title}>
						<CardContent className="flex flex-col gap-1 p-3 sm:gap-2 sm:p-4">
							<div className="flex items-center gap-1.5 sm:gap-2">
								<stat.icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', stat.color)} />
								<span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
									{stat.title}
								</span>
							</div>
							<p className="text-lg font-bold text-card-foreground sm:text-2xl">{stat.value}</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Charts section */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Monthly chart */}
				{/*         {selectedYear && monthlyData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                Monthly Performance - {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="h-[220px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ left: -10, right: 4 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="monthName"
                      className="text-xs fill-muted-foreground"
                    />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        color: "hsl(var(--card-foreground))",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="goals"
                      fill="hsl(var(--chart-1))"
                      radius={[4, 4, 0, 0]}
                      name="Goals"
                    />
                    <Bar
                      dataKey="assists"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                      name="Assists"
                    />
                    <Bar
                      dataKey="yellow_cards"
                      fill="hsl(var(--chart-3))"
                      radius={[4, 4, 0, 0]}
                      name="Yellow Cards"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )} */}

				{/* Top scorers */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Top goleadores</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col gap-3">
							{topScorers.map((player, i) => (
								<div
									key={player.id}
									className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
								>
									<div className="flex items-center gap-3">
										<span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
											{i + 1}
										</span>
										<div>
											<p className="text-sm font-medium text-foreground">
												{player.nombre} {player.apellido}
											</p>
											<p className="text-xs text-muted-foreground">
												{player.matches_played} partidos
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="text-lg font-bold text-primary">{player.total_goals}</p>
										<p className="text-xs text-muted-foreground">goles</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Top assisters */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Top asistentes</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col gap-3">
							{[...topScorers]
								.sort((a, b) => b.total_assists - a.total_assists)
								.slice(0, 5)
								.map((player, i) => (
									<div
										key={player.id}
										className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
									>
										<div className="flex items-center gap-3">
											<span className="flex h-7 w-7 items-center justify-center rounded-full bg-chart-2 text-xs font-bold text-primary-foreground">
												{i + 1}
											</span>
											<div>
												<p className="text-sm font-medium text-foreground">
													{player.nombre} {player.apellido}
												</p>
												<p className="text-xs text-muted-foreground">
													{player.matches_played} partidos
												</p>
											</div>
										</div>
										<div className="text-right">
											<p className="text-lg font-bold text-chart-2">{player.total_assists}</p>
											<p className="text-xs text-muted-foreground">asistencias</p>
										</div>
									</div>
								))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function cn(...classes: (string | undefined | false)[]) {
	return classes.filter(Boolean).join(' ');
}
