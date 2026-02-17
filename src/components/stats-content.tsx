"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Pencil, Trash2, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  fetchAllStats,
  fetchPlayers,
  removeMatchStat,
} from "@/lib/actions"
import { useYear } from "@/contexts/year-context"
import StatForm from "@/components/stat-form"
import type { MatchStat, PlayerWithAge } from "@/lib/db"

type StatWithPlayer = MatchStat & { player_name: string }

export default function StatsContent() {
  const { selectedYear } = useYear()
  const [stats, setStats] = useState<StatWithPlayer[]>([])
  const [players, setPlayers] = useState<PlayerWithAge[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [playerFilter, setPlayerFilter] = useState<string>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editingStat, setEditingStat] = useState<StatWithPlayer | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [s, p] = await Promise.all([
      fetchAllStats(),
      fetchPlayers(),
    ])
    setStats(s)
    setPlayers(p)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = stats.filter((s) => {
    if (selectedYear && new Date(s.match_date).getFullYear() !== selectedYear)
      return false
    if (playerFilter !== "all" && s.player_id !== Number(playerFilter))
      return false
    if (
      search &&
      !s.player_name.toLowerCase().includes(search.toLowerCase()) &&
      !s.match_date.includes(search)
    )
      return false
    return true
  })

  async function handleDelete() {
    if (!deleteId) return
    const result = await removeMatchStat(deleteId)
    if (result.success) {
      toast.success("Stat deleted")
      load()
    } else {
      toast.error("Failed to delete stat")
    }
    setDeleteId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              Estadísticas generales
            </h3>
            <p className="text-sm text-muted-foreground">
              {stats.length} records total
            </p>
          </div>
          <Button onClick={() => { setEditingStat(null); setFormOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Record Stat
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by player or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={playerFilter} onValueChange={setPlayerFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Player" />
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

        <Card>
          <CardContent className="p-0">
            {/* Desktop table */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Goals</TableHead>
                    <TableHead>Assists</TableHead>
                    <TableHead>Yellow</TableHead>
                    <TableHead>Red</TableHead>
                    <TableHead>Minutes</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                        No statistics found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.match_date}</TableCell>
                        <TableCell>{s.player_name}</TableCell>
                        <TableCell>
                          <Badge variant={s.goals > 0 ? "default" : "secondary"}>{s.goals}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.assists > 0 ? "default" : "secondary"}>{s.assists}</Badge>
                        </TableCell>
                        <TableCell>
                          {s.yellow_cards > 0 ? (
                            <Badge className="bg-chart-3 text-primary-foreground">{s.yellow_cards}</Badge>
                          ) : (
                            <Badge variant="secondary">0</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {s.red_cards > 0 ? (
                            <Badge className="bg-destructive text-destructive-foreground">{s.red_cards}</Badge>
                          ) : (
                            <Badge variant="secondary">0</Badge>
                          )}
                        </TableCell>
                        <TableCell>{s.minutes_played}</TableCell>
                        <TableCell className="max-w-[150px] truncate text-muted-foreground">
                          {s.notes || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingStat(s)
                                setFormOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit stat</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(s.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete stat</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col gap-2 p-4 lg:hidden">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No statistics found
                </p>
              ) : (
                filtered.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">{s.player_name}</p>
                        <p className="text-xs text-muted-foreground">{s.match_date}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingStat(s)
                            setFormOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(s.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <Badge variant={s.goals > 0 ? "default" : "secondary"}>
                        {s.goals} goals
                      </Badge>
                      <Badge variant={s.assists > 0 ? "default" : "secondary"}>
                        {s.assists} assists
                      </Badge>
                      {s.yellow_cards > 0 && (
                        <Badge className="bg-chart-3 text-primary-foreground">
                          {s.yellow_cards} yellow
                        </Badge>
                      )}
                      {s.red_cards > 0 && (
                        <Badge className="bg-destructive text-destructive-foreground">
                          {s.red_cards} red
                        </Badge>
                      )}
                      <Badge variant="secondary">{s.minutes_played} min</Badge>
                    </div>
                    {s.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">{s.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stat form dialog */}
      {formOpen && (
        <StatForm
          key={editingStat?.id ?? "new"}
          open={formOpen}
          onOpenChange={setFormOpen}
          stat={editingStat}
          players={players}
          onSuccess={load}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stat Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this match statistic? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
