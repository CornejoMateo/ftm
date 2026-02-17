"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { addMatchStat, editMatchStat } from "@/lib/actions"
import type { MatchStat, PlayerWithAge } from "@/lib/db"

interface StatFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stat?: (MatchStat & { player_name?: string }) | null
  players: PlayerWithAge[]
  onSuccess: () => void
}

export default function StatForm({
  open,
  onOpenChange,
  stat,
  players,
  onSuccess,
}: StatFormProps) {
  const [loading, setLoading] = useState(false)
  const [playerId, setPlayerId] = useState(stat?.player_id ? String(stat.player_id) : "")
  const [matchDate, setMatchDate] = useState(stat?.match_date ?? "")
  const [goals, setGoals] = useState(String(stat?.goals ?? 0))
  const [assists, setAssists] = useState(String(stat?.assists ?? 0))
  const [yellowCards, setYellowCards] = useState(String(stat?.yellow_cards ?? 0))
  const [redCards, setRedCards] = useState(String(stat?.red_cards ?? 0))
  const [minutesPlayed, setMinutesPlayed] = useState(String(stat?.minutes_played ?? 90))
  const [notes, setNotes] = useState(stat?.notes ?? "")

  const isEdit = !!stat

  function validateNum(val: string): boolean {
    const n = Number(val)
    return !Number.isNaN(n) && n >= 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!playerId || !matchDate) {
      toast.error("Player and match date are required")
      return
    }
    if (!validateNum(goals) || !validateNum(assists) || !validateNum(yellowCards) || !validateNum(redCards) || !validateNum(minutesPlayed)) {
      toast.error("Numeric values must be non-negative numbers")
      return
    }
    if (Number(minutesPlayed) > 120) {
      toast.error("Minutes played cannot exceed 120")
      return
    }

    setLoading(true)
    try {
      const data = {
        player_id: Number(playerId),
        match_date: matchDate,
        goals: Number(goals),
        assists: Number(assists),
        yellow_cards: Number(yellowCards),
        red_cards: Number(redCards),
        minutes_played: Number(minutesPlayed),
        notes,
      }

      if (isEdit && stat) {
        const result = await editMatchStat(stat.id, data)
        if (!result.success) {
          toast.error(result.error)
          return
        }
        toast.success("Stat updated successfully")
      } else {
        const result = await addMatchStat(data)
        if (!result.success) {
          toast.error(result.error)
          return
        }
        toast.success("Stat recorded successfully")
      }
      onSuccess()
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Match Stat" : "Record Match Stat"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the match statistics below."
              : "Record a player's performance for a match."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="player">Player</Label>
            <Select value={playerId} onValueChange={setPlayerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a player" />
              </SelectTrigger>
              <SelectContent>
                {players.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nombre} {p.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="matchDate">Match Date</Label>
            <Input
              id="matchDate"
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="goals">Goals</Label>
              <Input
                id="goals"
                type="number"
                min="0"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="assists">Assists</Label>
              <Input
                id="assists"
                type="number"
                min="0"
                value={assists}
                onChange={(e) => setAssists(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="yellowCards">Yellow Cards</Label>
              <Input
                id="yellowCards"
                type="number"
                min="0"
                value={yellowCards}
                onChange={(e) => setYellowCards(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="redCards">Red Cards</Label>
              <Input
                id="redCards"
                type="number"
                min="0"
                value={redCards}
                onChange={(e) => setRedCards(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="minutes">Minutes Played</Label>
            <Input
              id="minutes"
              type="number"
              min="0"
              max="120"
              value={minutesPlayed}
              onChange={(e) => setMinutesPlayed(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update" : "Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
