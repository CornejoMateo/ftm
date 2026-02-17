"use client"

import { useEffect, useState } from "react"
import { Plus, X, Trophy, Target, Clock, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  fetchPlayers,
  fetchPlayerComparison,
  fetchPlayerYearlyComparison,
} from "@/lib/actions"
import { useYear } from "@/contexts/year-context"
import type { PlayerWithAge, PlayerYearlyComparison } from "@/lib/db"

interface ComparisonData {
  id: number
  name: string
  edad: number
  matches: number
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  minutes: number
  goals_per_match: number
  assists_per_match: number
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
  color: "hsl(var(--card-foreground))",
}

export default function CompareContent() {
  const { selectedYear } = useYear()
  const [players, setPlayers] = useState<PlayerWithAge[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [comparison, setComparison] = useState<ComparisonData[]>([])
  const [yearlyComparison, setYearlyComparison] = useState<PlayerYearlyComparison[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPlayers().then(setPlayers)
  }, [])

  useEffect(() => {
    if (selectedIds.length < 2) {
      setComparison([])
      setYearlyComparison([])
      return
    }
    setLoading(true)
    const numYear = selectedYear ?? undefined
    Promise.all([
      fetchPlayerComparison(selectedIds, numYear),
      fetchPlayerYearlyComparison(selectedIds),
    ]).then(([data, yearly]) => {
      setComparison(data as ComparisonData[])
      setYearlyComparison(yearly)
      setLoading(false)
    })
  }, [selectedIds, selectedYear])

  function addPlayer(id: string) {
    if (id && !selectedIds.includes(Number(id)) && selectedIds.length < 5) {
      setSelectedIds([...selectedIds, Number(id)])
    }
  }

  function removePlayerFromComparison(id: number) {
    setSelectedIds(selectedIds.filter((sid) => sid !== id))
  }

  const availablePlayers = players.filter((p) => !selectedIds.includes(p.id))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-xl font-bold text-foreground sm:text-2xl">
          Comparación de jugadores
        </h3>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Selecciona hasta 5 jugadores para comparar sus estadísticas
        </p>
      </div>

      {/* Selection area */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Select onValueChange={addPlayer} value="">
                  <SelectTrigger>
                    <SelectValue placeholder="Agregar un jugador para comparar" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlayers.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nombre} {p.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedIds.map((id, i) => {
                  const p = players.find((pl) => pl.id === id)
                  if (!p) return null
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
                      style={{
                        backgroundColor: `${CHART_COLORS[i]}20`,
                        border: `1px solid ${CHART_COLORS[i]}`,
                        color: CHART_COLORS[i],
                      }}
                    >
                      <span className="font-medium">
                        {p.nombre} {p.apellido}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePlayerFromComparison(id)}
                        className="rounded-full p-0.5 transition-colors hover:bg-foreground/10"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Quitar {p.nombre}</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedIds.length < 2 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <Plus className="mb-4 h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">
            Selecciona al menos dos jugadores para ver la comparación
          </p>
        </div>
      )}

      {loading && selectedIds.length >= 2 && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && comparison.length >= 2 && (
        <Tabs defaultValue="overview" className="flex flex-col gap-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Comparación general</TabsTrigger>
{/*             <TabsTrigger value="charts" disabled>Charts</TabsTrigger>
            <TabsTrigger value="yearly" disabled>Year-by-Year</TabsTrigger> */}
          </TabsList>

          {/* ===== OVERVIEW TAB ===== */}
          <TabsContent value="overview" className="flex flex-col gap-6">
            <OverviewSection comparison={comparison} />
          </TabsContent>

          {/* ===== CHARTS TAB ===== */}
          <TabsContent value="charts" className="flex flex-col gap-6">
            <ChartsSection comparison={comparison} />
          </TabsContent>

          {/* ===== YEARLY TAB ===== */}
          <TabsContent value="yearly" className="flex flex-col gap-6">
            <YearlySection
              comparison={comparison}
              yearlyComparison={yearlyComparison}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

// ===================================================================
// Overview Section - stat cards + horizontal comparison bars
// ===================================================================

function OverviewSection({ comparison }: { comparison: ComparisonData[] }) {
  const statFields = [
    { key: "matches" as const, label: "Partidos jugados", icon: Trophy },
    { key: "goals" as const, label: "Goals", icon: Target },
    { key: "assists" as const, label: "Assists", icon: Target },
    { key: "minutes" as const, label: "Minutes Played", icon: Clock },
    { key: "yellow_cards" as const, label: "Yellow Cards", icon: ShieldAlert },
    { key: "red_cards" as const, label: "Red Cards", icon: ShieldAlert },
  ]

  return (
    <>
      {/* Side-by-side stat cards */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${Math.min(comparison.length, 3)}, 1fr)`,
        }}
      >
        {comparison.map((c, i) => (
          <Card key={c.id}>
            <CardHeader className="pb-2">
              <CardTitle
                className="text-base"
                style={{ color: CHART_COLORS[i] }}
              >
                {c.name}
              </CardTitle>
              <CardDescription>Edad: {c.edad </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Partidos</span>
                  <span className="font-bold text-card-foreground">{c.matches}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Goles</span>
                  <span className="font-bold text-card-foreground">{c.goals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asistencias</span>
                  <span className="font-bold text-card-foreground">{c.assists}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarjetas amarillas</span>
                  <span className="font-bold text-card-foreground">{c.yellow_cards}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarjetas rojas</span>
                  <span className="font-bold text-card-foreground">{c.red_cards}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minutos jugados</span>
                  <span className="font-bold text-card-foreground">
                    {c.minutes.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-muted-foreground">Goles/Partido</span>
                  <span className="font-mono font-bold text-card-foreground">
                    {c.goals_per_match}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asistencias/Partido</span>
                  <span className="font-mono font-bold text-card-foreground">
                    {c.assists_per_match}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Horizontal comparison bars per stat */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="text-base">Head-to-Head Breakdown</CardTitle>
          <CardDescription>
            Visual comparison of each metric across selected players
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {statFields.map((field) => {
            const max = Math.max(...comparison.map((c) => c[field.key]), 1)
            return (
              <div key={field.key} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <field.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{field.label}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {comparison.map((c, i) => {
                    const pct = max > 0 ? (c[field.key] / max) * 100 : 0
                    return (
                      <div key={c.id} className="flex items-center gap-3">
                        <span className="w-28 truncate text-xs text-muted-foreground">
                          {c.name}
                        </span>
                        <div className="relative flex-1 h-6 overflow-hidden rounded-md bg-muted">
                          <div
                            className="absolute inset-y-0 left-0 rounded-md transition-all duration-500"
                            style={{
                              width: `${Math.max(pct, 2)}%`,
                              backgroundColor: CHART_COLORS[i],
                            }}
                          />
                          <span className="absolute inset-y-0 right-2 flex items-center text-xs font-semibold text-foreground">
                            {field.key === "minutes"
                              ? c[field.key].toLocaleString()
                              : c[field.key]}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card> */}
    </>
  )
}

// ===================================================================
// Charts Section - bar, radar, efficiency, minutes distribution
// ===================================================================

function ChartsSection({ comparison }: { comparison: ComparisonData[] }) {
  // Grouped bar chart data
  const barData = [
    {
      stat: "Goals",
      ...Object.fromEntries(comparison.map((c) => [c.name, c.goals])),
    },
    {
      stat: "Assists",
      ...Object.fromEntries(comparison.map((c) => [c.name, c.assists])),
    },
    {
      stat: "Matches",
      ...Object.fromEntries(comparison.map((c) => [c.name, c.matches])),
    },
    {
      stat: "Yellow Cards",
      ...Object.fromEntries(comparison.map((c) => [c.name, c.yellow_cards])),
    },
  ]

  // Radar chart data (normalized to 100)
  const maxValues = {
    goals: Math.max(...comparison.map((c) => c.goals), 1),
    assists: Math.max(...comparison.map((c) => c.assists), 1),
    matches: Math.max(...comparison.map((c) => c.matches), 1),
    minutes: Math.max(...comparison.map((c) => c.minutes), 1),
    gpm: Math.max(...comparison.map((c) => c.goals_per_match), 0.01),
    apm: Math.max(...comparison.map((c) => c.assists_per_match), 0.01),
  }

  const radarData = [
    {
      stat: "Goals",
      ...Object.fromEntries(
        comparison.map((c) => [c.name, +((c.goals / maxValues.goals) * 100).toFixed(1)])
      ),
    },
    {
      stat: "Assists",
      ...Object.fromEntries(
        comparison.map((c) => [c.name, +((c.assists / maxValues.assists) * 100).toFixed(1)])
      ),
    },
    {
      stat: "Matches",
      ...Object.fromEntries(
        comparison.map((c) => [c.name, +((c.matches / maxValues.matches) * 100).toFixed(1)])
      ),
    },
    {
      stat: "Minutes",
      ...Object.fromEntries(
        comparison.map((c) => [c.name, +((c.minutes / maxValues.minutes) * 100).toFixed(1)])
      ),
    },
    {
      stat: "Goals/Match",
      ...Object.fromEntries(
        comparison.map((c) => [
          c.name,
          +((c.goals_per_match / maxValues.gpm) * 100).toFixed(1),
        ])
      ),
    },
    {
      stat: "Assists/Match",
      ...Object.fromEntries(
        comparison.map((c) => [
          c.name,
          +((c.assists_per_match / maxValues.apm) * 100).toFixed(1),
        ])
      ),
    },
  ]

  // Efficiency comparison - goals/match and assists/match
  const efficiencyData = comparison.map((c, i) => ({
    name: c.name,
    "Goals/Match": c.goals_per_match,
    "Assists/Match": c.assists_per_match,
    fill: CHART_COLORS[i],
  }))

  // Minutes distribution pie
  const totalMinutes = comparison.reduce((s, c) => s + c.minutes, 0)
  const minutesPieData = comparison.map((c, i) => ({
    name: c.name,
    value: c.minutes,
    percentage: totalMinutes > 0 ? +((c.minutes / totalMinutes) * 100).toFixed(1) : 0,
    fill: CHART_COLORS[i],
  }))

  // Discipline - stacked cards comparison
  const disciplineData = comparison.map((c) => ({
    name: c.name,
    Yellow: c.yellow_cards,
    Red: c.red_cards,
  }))

  return (
    <>
      {/* Grouped bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stats Comparison</CardTitle>
          <CardDescription>
            Side-by-side comparison of key statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis dataKey="stat" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                {comparison.map((c, i) => (
                  <Bar
                    key={c.id}
                    dataKey={c.name}
                    fill={CHART_COLORS[i]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Radar</CardTitle>
            <CardDescription>
              Normalized comparison across all metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis
                    dataKey="stat"
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    className="text-xs fill-muted-foreground"
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  {comparison.map((c, i) => (
                    <Radar
                      key={c.id}
                      name={c.name}
                      dataKey={c.name}
                      stroke={CHART_COLORS[i]}
                      fill={CHART_COLORS[i]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Minutes distribution donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Minutes Distribution</CardTitle>
            <CardDescription>
              Share of total playing time among compared players
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={minutesPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                  >
                    {minutesPieData.map((entry, i) => (
                      <Cell key={entry.name} fill={CHART_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value: number) => [
                      `${value.toLocaleString()} min`,
                      "Minutes",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Efficiency comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Efficiency Comparison</CardTitle>
          <CardDescription>
            Per-match output: goals and assists per game played
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={efficiencyData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  className="text-xs fill-muted-foreground"
                  domain={[0, "auto"]}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  className="text-xs fill-muted-foreground"
                  width={120}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                <Bar
                  dataKey="Goals/Match"
                  fill="hsl(var(--chart-1))"
                  radius={[0, 4, 4, 0]}
                  barSize={16}
                />
                <Bar
                  dataKey="Assists/Match"
                  fill="hsl(var(--chart-2))"
                  radius={[0, 4, 4, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Discipline comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Discipline Comparison</CardTitle>
          <CardDescription>
            Yellow and red card count per player
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={disciplineData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  className="text-xs fill-muted-foreground"
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  className="text-xs fill-muted-foreground"
                  width={120}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                <Bar
                  dataKey="Yellow"
                  stackId="cards"
                  fill="hsl(var(--chart-3))"
                  radius={[0, 0, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="Red"
                  stackId="cards"
                  fill="hsl(var(--chart-4))"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// ===================================================================
// Yearly Section - year-by-year trends for selected players
// ===================================================================

function YearlySection({
  comparison,
  yearlyComparison,
}: {
  comparison: ComparisonData[]
  yearlyComparison: PlayerYearlyComparison[]
}) {
  if (yearlyComparison.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">
          No year-by-year data available for the selected players
        </p>
      </div>
    )
  }

  const playerNames = comparison.map((c) => c.name)

  // Goals per year line data
  const goalsLineData = yearlyComparison.map((yc) => {
    const entry: Record<string, string | number> = { year: String(yc.year) }
    for (const p of yc.players) {
      entry[p.name] = p.goals
    }
    return entry
  })

  // Assists per year line data
  const assistsLineData = yearlyComparison.map((yc) => {
    const entry: Record<string, string | number> = { year: String(yc.year) }
    for (const p of yc.players) {
      entry[p.name] = p.assists
    }
    return entry
  })

  // Matches per year
  const matchesLineData = yearlyComparison.map((yc) => {
    const entry: Record<string, string | number> = { year: String(yc.year) }
    for (const p of yc.players) {
      entry[p.name] = p.matches
    }
    return entry
  })

  // Goals/match efficiency per year
  const efficiencyLineData = yearlyComparison.map((yc) => {
    const entry: Record<string, string | number> = { year: String(yc.year) }
    for (const p of yc.players) {
      entry[p.name] = p.goals_per_match
    }
    return entry
  })

  // Per-year stacked bars (goals+assists combined per player)
  const stackedBarData = yearlyComparison.map((yc) => {
    const entry: Record<string, string | number> = { year: String(yc.year) }
    for (const p of yc.players) {
      entry[`${p.name} Goals`] = p.goals
      entry[`${p.name} Assists`] = p.assists
    }
    return entry
  })

  return (
    <>
      {/* Goals trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Goals - Year by Year</CardTitle>
          <CardDescription>
            How each player{"'"}s goal tally evolved over the years
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={goalsLineData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="year"
                  className="text-xs fill-muted-foreground"
                />
                <YAxis
                  className="text-xs fill-muted-foreground"
                  allowDecimals={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                {playerNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={CHART_COLORS[i]}
                    strokeWidth={2}
                    dot={{ r: 4, fill: CHART_COLORS[i] }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assists trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assists - Year by Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={assistsLineData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="year"
                    className="text-xs fill-muted-foreground"
                  />
                  <YAxis
                    className="text-xs fill-muted-foreground"
                    allowDecimals={false}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  {playerNames.map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={CHART_COLORS[i]}
                      strokeWidth={2}
                      dot={{ r: 4, fill: CHART_COLORS[i] }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Matches trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Appearances - Year by Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={matchesLineData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="year"
                    className="text-xs fill-muted-foreground"
                  />
                  <YAxis
                    className="text-xs fill-muted-foreground"
                    allowDecimals={false}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  {playerNames.map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={CHART_COLORS[i]}
                      strokeWidth={2}
                      dot={{ r: 4, fill: CHART_COLORS[i] }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Efficiency over time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Goals per Match - Year by Year
          </CardTitle>
          <CardDescription>
            Scoring efficiency trend over the years
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={efficiencyLineData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="year"
                  className="text-xs fill-muted-foreground"
                />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                {playerNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={CHART_COLORS[i]}
                    strokeWidth={2}
                    strokeDasharray={i % 2 === 1 ? "5 5" : undefined}
                    dot={{ r: 4, fill: CHART_COLORS[i] }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Contributions per year stacked bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Goal Contributions per Year
          </CardTitle>
          <CardDescription>
            Goals and assists stacked per player for each year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedBarData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="year"
                  className="text-xs fill-muted-foreground"
                />
                <YAxis
                  className="text-xs fill-muted-foreground"
                  allowDecimals={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                {playerNames.map((name, i) => (
                  <Bar
                    key={`${name}-goals`}
                    dataKey={`${name} Goals`}
                    stackId={name}
                    fill={CHART_COLORS[i]}
                    radius={[0, 0, 0, 0]}
                  />
                ))}
                {playerNames.map((name, i) => (
                  <Bar
                    key={`${name}-assists`}
                    dataKey={`${name} Assists`}
                    stackId={name}
                    fill={CHART_COLORS[i]}
                    fillOpacity={0.45}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
