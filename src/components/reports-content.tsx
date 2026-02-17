"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import {
  fetchPlayersWithStats,
  fetchMonthlyStats,
  fetchTeamStats,
} from "@/lib/actions"
import { useYear } from "@/contexts/year-context"
import type { PlayerWithStats } from "@/lib/db"

interface MonthlyData {
  month: number
  monthName: string
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
}

export default function ReportsContent() {
  const { selectedYear } = useYear()
  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [teamStats, setTeamStats] = useState<{
    total_matches: number
    total_goals: number
    total_assists: number
    total_yellow_cards: number
    total_red_cards: number
    total_minutes: number
    total_players: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const year = selectedYear ?? "all"

  useEffect(() => {
    setLoading(true)
    const numYear = selectedYear ?? undefined
    Promise.all([
      fetchPlayersWithStats(numYear),
      numYear ? fetchMonthlyStats(numYear) : Promise.resolve([]),
      fetchTeamStats(numYear),
    ]).then(([p, m, t]) => {
      setPlayers(p.sort((a, b) => b.total_goals - a.total_goals))
      setMonthlyData(m)
      setTeamStats(t)
      setLoading(false)
    })
  }, [selectedYear])

  if (loading || !teamStats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius)",
    color: "hsl(var(--card-foreground))",
  }

  // Player bar chart data (top 10)
  const playerChartData = players.slice(0, 10).map((p) => ({
    name: `${p.nombre} ${p.apellido.charAt(0)}.`,
    goals: p.total_goals,
    assists: p.total_assists,
    yellow: p.total_yellow_cards,
  }))

  // Radar data for top 5
  const top5 = players.slice(0, 5)
  const maxGoals = Math.max(...top5.map((p) => p.total_goals), 1)
  const maxAssists = Math.max(...top5.map((p) => p.total_assists), 1)
  const maxMatches = Math.max(...top5.map((p) => p.matches_played), 1)
  const maxMinutes = Math.max(...top5.map((p) => p.total_minutes), 1)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground">
            Reports & Analytics
          </h3>
          <p className="text-sm text-muted-foreground">
            Detailed team and player performance reports {selectedYear ? `for ${selectedYear}` : "for all time"}
          </p>
        </div>
      </div>

      {/* Team summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Matches</p>
            <p className="text-2xl font-bold text-card-foreground">{teamStats.total_matches}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Goals Scored</p>
            <p className="text-2xl font-bold text-card-foreground">{teamStats.total_goals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Goals/Match</p>
            <p className="text-2xl font-bold text-card-foreground">
              {teamStats.total_matches > 0
                ? (teamStats.total_goals / teamStats.total_matches).toFixed(1)
                : "0"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Cards</p>
            <p className="text-2xl font-bold text-card-foreground">
              {teamStats.total_yellow_cards + teamStats.total_red_cards}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="charts">
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="table">Player Table</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="flex flex-col gap-6 mt-4">
          {/* Monthly breakdown */}
          {year !== "all" && monthlyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Breakdown - {year}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="monthName" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Bar dataKey="goals" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Goals" />
                      <Bar dataKey="assists" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Assists" />
                      <Bar dataKey="yellow_cards" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Yellow Cards" />
                      <Bar dataKey="red_cards" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} name="Red Cards" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Player performance chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Player Performance (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={playerChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-xs fill-muted-foreground" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      className="text-xs fill-muted-foreground"
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="goals" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} name="Goals" />
                    <Bar dataKey="assists" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name="Assists" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Radar chart for top 5 */}
          {top5.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Scorer Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={[
                        { stat: "Goals", ...Object.fromEntries(top5.map((p) => [p.id, (p.total_goals / maxGoals) * 100])) },
                        { stat: "Assists", ...Object.fromEntries(top5.map((p) => [p.id, (p.total_assists / maxAssists) * 100])) },
                        { stat: "Matches", ...Object.fromEntries(top5.map((p) => [p.id, (p.matches_played / maxMatches) * 100])) },
                        { stat: "Minutes", ...Object.fromEntries(top5.map((p) => [p.id, (p.total_minutes / maxMinutes) * 100])) },
                      ]}
                    >
                      <PolarGrid className="stroke-border" />
                      <PolarAngleAxis dataKey="stat" className="text-xs fill-muted-foreground" />
                      <PolarRadiusAxis className="text-xs fill-muted-foreground" />
                      {top5.map((p, i) => {
                        const colors = [
                          "hsl(var(--chart-1))",
                          "hsl(var(--chart-2))",
                          "hsl(var(--chart-3))",
                          "hsl(var(--chart-4))",
                          "hsl(var(--chart-5))",
                        ]
                        return (
                          <Radar
                            key={p.id}
                            name={`${p.nombre} ${p.apellido.charAt(0)}.`}
                            dataKey={String(p.id)}
                            stroke={colors[i]}
                            fill={colors[i]}
                            fillOpacity={0.1}
                          />
                        )
                      })}
                      <Legend />
                      <Tooltip contentStyle={tooltipStyle} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Age</TableHead>
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
                    {players.filter((p) => p.matches_played > 0).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.nombre} {p.apellido}
                        </TableCell>
                        <TableCell>{p.edad </TableCell>
                        <TableCell>{p.matches_played}</TableCell>
                        <TableCell>
                          <Badge variant={p.total_goals > 0 ? "default" : "secondary"}>
                            {p.total_goals}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.total_assists > 0 ? "default" : "secondary"}>
                            {p.total_assists}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {p.total_yellow_cards > 0 ? (
                            <Badge className="bg-chart-3 text-primary-foreground">
                              {p.total_yellow_cards}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">0</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {p.total_red_cards > 0 ? (
                            <Badge className="bg-destructive text-destructive-foreground">
                              {p.total_red_cards}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">0</Badge>
                          )}
                        </TableCell>
                        <TableCell>{p.total_minutes}</TableCell>
                        <TableCell className="font-mono">
                          {p.matches_played > 0
                            ? (p.total_goals / p.matches_played).toFixed(2)
                            : "0.00"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile */}
              <div className="flex flex-col gap-2 p-4 md:hidden">
                {players.filter((p) => p.matches_played > 0).map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">
                        {p.nombre} {p.apellido}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.matches_played} matches
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <Badge variant="default">{p.total_goals} goals</Badge>
                      <Badge variant="default">{p.total_assists} assists</Badge>
                      {p.total_yellow_cards > 0 && (
                        <Badge className="bg-chart-3 text-primary-foreground">
                          {p.total_yellow_cards} yellow
                        </Badge>
                      )}
                      {p.total_red_cards > 0 && (
                        <Badge className="bg-destructive text-destructive-foreground">
                          {p.total_red_cards} red
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
