'use client';

import React from 'react';

import { useEffect, useState, useCallback } from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
	LineChart,
	Line,
} from 'recharts';
import {
	Target,
	HandHelping,
	AlertTriangle,
	Timer,
	Trophy,
	TrendingUp,
	TrendingDown,
	Minus,
} from 'lucide-react';
import { fetchPlayerAnnualReports, fetchPlayers } from '@/lib/actions';
import type { AnnualPlayerReport } from '@/lib/db';
import type { PlayerWithAge } from '@/lib/db';
import { useYear } from '@/contexts/year-context';

export default function AnnualReportsContent() {
	const { selectedYear } = useYear();
	const [selectedPlayer, setSelectedPlayer] = useState<string>('all');
	const [players, setPlayers] = useState<PlayerWithAge[]>([]);
	const [reports, setReports] = useState<AnnualPlayerReport[]>([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		setLoading(true);
		const [p, r] = await Promise.all([
			fetchPlayers(),
			fetchPlayerAnnualReports(
				selectedPlayer === 'all' ? undefined : Number(selectedPlayer),
				selectedYear ?? undefined
			),
		]);
		//setPlayers(p);
		setReports(r);
		setLoading(false);
	}, [selectedPlayer, selectedYear]);

	useEffect(() => {
		load();
	}, [selectedPlayer, selectedYear]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	const tooltipStyle = {
		backgroundColor: 'hsl(var(--card))',
		border: '1px solid hsl(var(--border))',
		borderRadius: 'var(--radius)',
		color: 'hsl(var(--card-foreground))',
	};

	// When showing a single player, show their year-by-year breakdown
	const isSinglePlayer = selectedPlayer !== 'all' && reports.length === 1;
	const singleReport = isSinglePlayer ? reports[0] : null;

	// For "all players" view, aggregate all players' stats by year
	const yearAggregated = (() => {
		const map = new Map<
			number,
			{
				year: number;
				players: number;
				matches: number;
				goals: number;
				assists: number;
				yellow_cards: number;
				red_cards: number;
				minutes: number;
			}
		>();
		for (const r of reports) {
			for (const y of r.years) {
				if (!map.has(y.year)) {
					map.set(y.year, {
						year: y.year,
						players: 0,
						matches: 0,
						goals: 0,
						assists: 0,
						yellow_cards: 0,
						red_cards: 0,
						minutes: 0,
					});
				}
				const entry = map.get(y.year)!;
				entry.players += 1;
				entry.matches += y.matches;
				entry.goals += y.goals;
				entry.assists += y.assists;
				entry.yellow_cards += y.yellow_cards;
				entry.red_cards += y.red_cards;
				entry.minutes += y.minutes;
			}
		}
		return Array.from(map.values()).sort((a, b) => a.year - b.year);
	})();

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h3 className="text-2xl font-bold text-foreground">Annual Reports</h3>
					<p className="text-sm text-muted-foreground">
						Year-by-year performance breakdown per player
					</p>
				</div>
				<Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder="Select player" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Players</SelectItem>
						{players.map((p) => (
							<SelectItem key={p.id} value={String(p.id)}>
								{p.nombre} {p.apellido}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Single player detailed annual view */}
			{isSinglePlayer && singleReport && (
				<SinglePlayerAnnual report={singleReport} tooltipStyle={tooltipStyle} />
			)}

			{/* All players overview */}
			{!isSinglePlayer && (
				<AllPlayersAnnual
					yearAggregated={yearAggregated}
					reports={reports}
					tooltipStyle={tooltipStyle}
				/>
			)}
		</div>
	);
}

function TrendIcon({ current, previous }: { current: number; previous: number }) {
	if (current > previous) {
		return <TrendingUp className="h-4 w-4 text-primary" />;
	}
	if (current < previous) {
		return <TrendingDown className="h-4 w-4 text-destructive" />;
	}
	return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function SinglePlayerAnnual({
	report,
	tooltipStyle,
}: {
	report: AnnualPlayerReport;
	tooltipStyle: React.CSSProperties;
}) {
	const years = report.years;

	// Career totals
	const totals = {
		matches: years.reduce((s, y) => s + y.matches, 0),
		goals: years.reduce((s, y) => s + y.goals, 0),
		assists: years.reduce((s, y) => s + y.assists, 0),
		yellow_cards: years.reduce((s, y) => s + y.yellow_cards, 0),
		red_cards: years.reduce((s, y) => s + y.red_cards, 0),
		minutes: years.reduce((s, y) => s + y.minutes, 0),
	};

	const summaryCards = [
		{ title: 'Total Matches', value: totals.matches, icon: Trophy },
		{ title: 'Total Goals', value: totals.goals, icon: Target },
		{ title: 'Total Assists', value: totals.assists, icon: HandHelping },
		{
			title: 'Total Cards',
			value: totals.yellow_cards + totals.red_cards,
			icon: AlertTriangle,
		},
		{
			title: 'Total Minutes',
			value: totals.minutes.toLocaleString(),
			icon: Timer,
		},
	];

	// Line chart for trends
	const trendData = [...years].reverse().map((y) => ({
		year: String(y.year),
		goals: y.goals,
		assists: y.assists,
		matches: y.matches,
		'goals/match': y.goals_per_match,
	}));

	// Bar chart for each year
	const barData = [...years].reverse().map((y) => ({
		year: String(y.year),
		goals: y.goals,
		assists: y.assists,
		yellow: y.yellow_cards,
		red: y.red_cards,
	}));

	return (
		<>
			{/* Career totals */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
				{summaryCards.map((card) => (
					<Card key={card.title}>
						<CardContent className="flex flex-col gap-1 p-4">
							<div className="flex items-center gap-2">
								<card.icon className="h-4 w-4 text-primary" />
								<span className="text-xs text-muted-foreground">{card.title}</span>
							</div>
							<p className="text-2xl font-bold text-card-foreground">{card.value}</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Trend line chart */}
			{trendData.length > 1 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Year-over-Year Trend - {report.player_name}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="h-[280px]">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={trendData}>
									<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
									<XAxis dataKey="year" className="text-xs fill-muted-foreground" />
									<YAxis className="text-xs fill-muted-foreground" />
									<Tooltip contentStyle={tooltipStyle} />
									<Legend />
									<Line
										type="monotone"
										dataKey="goals"
										stroke="hsl(var(--chart-1))"
										strokeWidth={2}
										dot={{ r: 5, fill: 'hsl(var(--chart-1))' }}
										name="Goals"
									/>
									<Line
										type="monotone"
										dataKey="assists"
										stroke="hsl(var(--chart-2))"
										strokeWidth={2}
										dot={{ r: 5, fill: 'hsl(var(--chart-2))' }}
										name="Assists"
									/>
									<Line
										type="monotone"
										dataKey="matches"
										stroke="hsl(var(--chart-5))"
										strokeWidth={2}
										dot={{ r: 5, fill: 'hsl(var(--chart-5))' }}
										name="Matches"
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Yearly breakdown bar chart */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Annual Breakdown</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="h-[280px]">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={barData}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
								<XAxis dataKey="year" className="text-xs fill-muted-foreground" />
								<YAxis className="text-xs fill-muted-foreground" />
								<Tooltip contentStyle={tooltipStyle} />
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
									dataKey="yellow"
									fill="hsl(var(--chart-3))"
									radius={[4, 4, 0, 0]}
									name="Yellow Cards"
								/>
								<Bar
									dataKey="red"
									fill="hsl(var(--chart-4))"
									radius={[4, 4, 0, 0]}
									name="Red Cards"
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>

			{/* Year-by-year table */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Detailed Annual Statistics</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{/* Desktop */}
					<div className="hidden md:block">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Year</TableHead>
									<TableHead>Matches</TableHead>
									<TableHead>Goals</TableHead>
									<TableHead>Assists</TableHead>
									<TableHead>Yellow</TableHead>
									<TableHead>Red</TableHead>
									<TableHead>Minutes</TableHead>
									<TableHead>Goals/Match</TableHead>
									<TableHead>Assists/Match</TableHead>
									<TableHead className="w-[60px]">Trend</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{years.map((y, idx) => {
									const prev = idx < years.length - 1 ? years[idx + 1] : null;
									return (
										<TableRow key={y.year}>
											<TableCell className="font-semibold text-foreground">{y.year}</TableCell>
											<TableCell>{y.matches}</TableCell>
											<TableCell>
												<Badge variant={y.goals > 0 ? 'default' : 'secondary'}>{y.goals}</Badge>
											</TableCell>
											<TableCell>
												<Badge variant={y.assists > 0 ? 'default' : 'secondary'}>{y.assists}</Badge>
											</TableCell>
											<TableCell>
												{y.yellow_cards > 0 ? (
													<Badge className="bg-chart-3 text-primary-foreground">
														{y.yellow_cards}
													</Badge>
												) : (
													<Badge variant="secondary">0</Badge>
												)}
											</TableCell>
											<TableCell>
												{y.red_cards > 0 ? (
													<Badge className="bg-destructive text-destructive-foreground">
														{y.red_cards}
													</Badge>
												) : (
													<Badge variant="secondary">0</Badge>
												)}
											</TableCell>
											<TableCell>{y.minutes.toLocaleString()}</TableCell>
											<TableCell className="font-mono">{y.goals_per_match}</TableCell>
											<TableCell className="font-mono">{y.assists_per_match}</TableCell>
											<TableCell>
												{prev ? (
													<TrendIcon current={y.goals} previous={prev.goals} />
												) : (
													<Minus className="h-4 w-4 text-muted-foreground" />
												)}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>

					{/* Mobile */}
					<div className="flex flex-col gap-3 p-4 md:hidden">
						{years.map((y, idx) => {
							const prev = idx < years.length - 1 ? years[idx + 1] : null;
							return (
								<div key={y.year} className="rounded-lg border border-border p-4">
									<div className="flex items-center justify-between">
										<p className="text-lg font-bold text-foreground">{y.year}</p>
										<div className="flex items-center gap-2">
											{prev && <TrendIcon current={y.goals} previous={prev.goals} />}
											<span className="text-xs text-muted-foreground">{y.matches} matches</span>
										</div>
									</div>
									<div className="mt-3 grid grid-cols-3 gap-2">
										<div className="rounded-md bg-muted p-2 text-center">
											<p className="text-lg font-bold text-card-foreground">{y.goals}</p>
											<p className="text-xs text-muted-foreground">Goals</p>
										</div>
										<div className="rounded-md bg-muted p-2 text-center">
											<p className="text-lg font-bold text-card-foreground">{y.assists}</p>
											<p className="text-xs text-muted-foreground">Assists</p>
										</div>
										<div className="rounded-md bg-muted p-2 text-center">
											<p className="text-lg font-bold text-card-foreground">
												{y.minutes.toLocaleString()}
											</p>
											<p className="text-xs text-muted-foreground">Min</p>
										</div>
									</div>
									<div className="mt-2 flex flex-wrap gap-2 text-xs">
										{y.yellow_cards > 0 && (
											<Badge className="bg-chart-3 text-primary-foreground">
												{y.yellow_cards} yellow
											</Badge>
										)}
										{y.red_cards > 0 && (
											<Badge className="bg-destructive text-destructive-foreground">
												{y.red_cards} red
											</Badge>
										)}
										<Badge variant="secondary">{y.goals_per_match} goals/match</Badge>
									</div>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>
		</>
	);
}

function AllPlayersAnnual({
	yearAggregated,
	reports,
	tooltipStyle,
}: {
	yearAggregated: {
		year: number;
		players: number;
		matches: number;
		goals: number;
		assists: number;
		yellow_cards: number;
		red_cards: number;
		minutes: number;
	}[];
	reports: AnnualPlayerReport[];
	tooltipStyle: React.CSSProperties;
}) {
	// Team trend chart
	const teamTrendData = yearAggregated.map((y) => ({
		year: String(y.year),
		goals: y.goals,
		assists: y.assists,
		matches: y.matches,
	}));

	return (
		<>
			{/* Year summary cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{yearAggregated.map((y) => (
					<Card key={y.year}>
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center justify-between text-lg">
								<span>{y.year}</span>
								<Badge variant="secondary">{y.players} players</Badge>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-3 gap-3">
								<div className="text-center">
									<p className="text-xl font-bold text-card-foreground">{y.goals}</p>
									<p className="text-xs text-muted-foreground">Goals</p>
								</div>
								<div className="text-center">
									<p className="text-xl font-bold text-card-foreground">{y.assists}</p>
									<p className="text-xs text-muted-foreground">Assists</p>
								</div>
								<div className="text-center">
									<p className="text-xl font-bold text-card-foreground">{y.matches}</p>
									<p className="text-xs text-muted-foreground">Appearances</p>
								</div>
							</div>
							<div className="mt-3 flex flex-wrap gap-2 text-xs">
								{y.yellow_cards > 0 && (
									<Badge className="bg-chart-3 text-primary-foreground">
										{y.yellow_cards} yellow
									</Badge>
								)}
								{y.red_cards > 0 && (
									<Badge className="bg-destructive text-destructive-foreground">
										{y.red_cards} red
									</Badge>
								)}
								<Badge variant="secondary">{y.minutes.toLocaleString()} min</Badge>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Team trend chart */}
			{teamTrendData.length > 1 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Team Performance by Year</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="h-[280px]">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={teamTrendData}>
									<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
									<XAxis dataKey="year" className="text-xs fill-muted-foreground" />
									<YAxis className="text-xs fill-muted-foreground" />
									<Tooltip contentStyle={tooltipStyle} />
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
										dataKey="matches"
										fill="hsl(var(--chart-5))"
										radius={[4, 4, 0, 0]}
										name="Appearances"
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Per-player annual table */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">All Players - Annual Breakdown</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{/* Desktop */}
					<div className="hidden md:block">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Player</TableHead>
									<TableHead>Year</TableHead>
									<TableHead>Matches</TableHead>
									<TableHead>Goals</TableHead>
									<TableHead>Assists</TableHead>
									<TableHead>Yellow</TableHead>
									<TableHead>Red</TableHead>
									<TableHead>Minutes</TableHead>
									<TableHead>Goals/Match</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{reports.flatMap((r) =>
									r.years.map((y, yi) => (
										<TableRow key={`${r.player_id}-${y.year}`}>
											{yi === 0 ? (
												<TableCell
													className="font-medium text-foreground align-top"
													rowSpan={r.years.length}
												>
													{r.player_name}
												</TableCell>
											) : null}
											<TableCell className="font-semibold">{y.year}</TableCell>
											<TableCell>{y.matches}</TableCell>
											<TableCell>
												<Badge variant={y.goals > 0 ? 'default' : 'secondary'}>{y.goals}</Badge>
											</TableCell>
											<TableCell>
												<Badge variant={y.assists > 0 ? 'default' : 'secondary'}>{y.assists}</Badge>
											</TableCell>
											<TableCell>
												{y.yellow_cards > 0 ? (
													<Badge className="bg-chart-3 text-primary-foreground">
														{y.yellow_cards}
													</Badge>
												) : (
													<Badge variant="secondary">0</Badge>
												)}
											</TableCell>
											<TableCell>
												{y.red_cards > 0 ? (
													<Badge className="bg-destructive text-destructive-foreground">
														{y.red_cards}
													</Badge>
												) : (
													<Badge variant="secondary">0</Badge>
												)}
											</TableCell>
											<TableCell>{y.minutes.toLocaleString()}</TableCell>
											<TableCell className="font-mono">{y.goals_per_match}</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{/* Mobile */}
					<div className="flex flex-col gap-4 p-4 md:hidden">
						{reports.map((r) => (
							<div key={r.player_id} className="flex flex-col gap-2">
								<p className="font-semibold text-foreground">{r.player_name}</p>
								{r.years.map((y) => (
									<div key={y.year} className="rounded-lg border border-border p-3">
										<div className="flex items-center justify-between">
											<p className="font-medium text-foreground">{y.year}</p>
											<span className="text-xs text-muted-foreground">{y.matches} matches</span>
										</div>
										<div className="mt-2 flex flex-wrap gap-2 text-xs">
											<Badge variant="default">{y.goals} goals</Badge>
											<Badge variant="default">{y.assists} assists</Badge>
											{y.yellow_cards > 0 && (
												<Badge className="bg-chart-3 text-primary-foreground">
													{y.yellow_cards} yellow
												</Badge>
											)}
											{y.red_cards > 0 && (
												<Badge className="bg-destructive text-destructive-foreground">
													{y.red_cards} red
												</Badge>
											)}
											<Badge variant="secondary">{y.minutes} min</Badge>
										</div>
									</div>
								))}
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</>
	);
}
