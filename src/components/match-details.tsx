'use client';

import React, { useEffect, useState } from 'react';
import { X, Calendar, MapPin, MapPinOff, Users, Plus, Pencil, Trash2 } from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Match } from '@/lib/matchs/match';
import {
	fetchMatchPlayersByMatch,
	fetchAllPlayers,
	addMatchPlayer,
	editMatchPlayer,
	removeMatchPlayer,
} from '@/lib/actions';
import type { MatchPlayer, MatchPlayerInput } from '@/lib/matchs_players/match_player';
import type { Player } from '@/lib/players/player';
import { getMatchResultType, getResultColor } from '@/utils/match';
import { toast } from 'sonner';

interface MatchDetailsProps {
	match: Match | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export default function MatchDetails({ match, open, onOpenChange }: MatchDetailsProps) {
	const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([]);
	const [loading, setLoading] = useState(false);
	const [playerFormOpen, setPlayerFormOpen] = useState(false);
	const [editingMatchPlayer, setEditingMatchPlayer] = useState<MatchPlayer | null>(null);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [players, setPlayers] = useState<Player[]>([]);
	const [formData, setFormData] = useState<MatchPlayerInput>({
		match_id: 0,
		player_id: 0,
		minutes_played: 0,
		goals: 0,
		assists: 0,
		yellow_cards: 0,
		red_cards: 0,
		starter: true,
		minute_login: null,
		calification: null,
	});
	const [submitting, setSubmitting] = useState(false);
	const [categoryFilter, setCategoryFilter] = useState<string>('all');

	useEffect(() => {
		if (match && open) {
			loadMatchPlayers();
			loadPlayers();
		}
	}, [match, open]);

	useEffect(() => {
		if (match) {
			setFormData((prev) => ({ ...prev, match_id: match.id }));
		}
	}, [match]);

	useEffect(() => {
		if (!playerFormOpen) {
			// Reset category filter when form closes
			setCategoryFilter('all');
		}
	}, [playerFormOpen]);

	useEffect(() => {
		if (editingMatchPlayer) {
			setFormData({
				match_id: editingMatchPlayer.match_id,
				player_id: editingMatchPlayer.player_id,
				minutes_played: editingMatchPlayer.minutes_played,
				goals: editingMatchPlayer.goals,
				assists: editingMatchPlayer.assists,
				yellow_cards: editingMatchPlayer.yellow_cards,
				red_cards: editingMatchPlayer.red_cards,
				starter: editingMatchPlayer.starter,
				minute_login: editingMatchPlayer.minute_login,
				calification: editingMatchPlayer.calification,
			});
			setPlayerFormOpen(true);
		} else if (!playerFormOpen && match) {
			// Reset form when closing without editing
			setFormData({
				match_id: match.id,
				player_id: 0,
				minutes_played: 0,
				goals: 0,
				assists: 0,
				yellow_cards: 0,
				red_cards: 0,
				starter: true,
				minute_login: null,
				calification: null,
			});
		}
	}, [editingMatchPlayer, playerFormOpen, match]);

	async function loadMatchPlayers() {
		if (!match) return;
		setLoading(true);
		try {
			const data = await fetchMatchPlayersByMatch(match.id);
			setMatchPlayers(data);
		} catch (error) {
			console.error('Error al cargar jugadores del partido:', error);
		} finally {
			setLoading(false);
		}
	}

	async function loadPlayers() {
		try {
			const data = await fetchAllPlayers();
			const activePlayers = data.filter((p) => p.active);
			setPlayers(activePlayers);
		} catch (error) {
			console.error('Error al cargar jugadores:', error);
		}
	}

	// Get unique categories
	const categories = Array.from(new Set(players.map((p) => p.category).filter(Boolean)));

	// Filter out players already added to this match (except when editing) and by category
	const availablePlayers = players.filter(
		(player) =>
			(editingMatchPlayer?.player_id === player.id ||
				!matchPlayers.some((mp) => mp.player_id === player.id)) &&
			(categoryFilter === 'all' || player.category === categoryFilter)
	);

	// Create a player lookup map
	const playerMap = new Map(players.map((p) => [p.id, p]));

	async function handleSubmitPlayer(e: React.FormEvent) {
		e.preventDefault();
		if (!match || formData.player_id === 0) {
			toast.error('Por favor selecciona un jugador');
			return;
		}

		// Parse all numeric values
		const parsedData: MatchPlayerInput = {
			match_id: formData.match_id,
			player_id: formData.player_id,
			minutes_played: parseInt(formData.minutes_played as any) || 0,
			goals: parseInt(formData.goals as any) || 0,
			assists: parseInt(formData.assists as any) || 0,
			yellow_cards: parseInt(formData.yellow_cards as any) || 0,
			red_cards: parseInt(formData.red_cards as any) || 0,
			starter: formData.starter,
			minute_login: formData.minute_login ? parseInt(formData.minute_login as any) : null,
			calification: formData.calification ? parseFloat(formData.calification as any) : null,
		};

		setSubmitting(true);
		try {
			let result;
			if (editingMatchPlayer) {
				// Editing existing player
				result = await editMatchPlayer(editingMatchPlayer.id, parsedData);
				if (result.success) {
					toast.success('Datos del jugador actualizados');
				}
			} else {
				// Adding new player
				result = await addMatchPlayer(parsedData);
				if (result.success) {
					toast.success('Jugador agregado al partido');
				}
			}

			if (result.success) {
				setPlayerFormOpen(false);
				setEditingMatchPlayer(null);
				await loadMatchPlayers();
			} else {
				toast.error(result.error || 'Error al guardar datos del jugador');
			}
		} catch (error) {
			console.error('Error:', error);
			toast.error('Error al guardar datos del jugador');
		} finally {
			setSubmitting(false);
		}
	}

	async function handleDelete() {
		if (!deleteId) return;

		try {
			const result = await removeMatchPlayer(deleteId);
			if (result.success) {
				toast.success('Jugador eliminado del partido');
				await loadMatchPlayers();
			} else {
				toast.error(result.error || 'Error al eliminar jugador');
			}
		} catch (error) {
			console.error('Error:', error);
			toast.error('Error al eliminar jugador');
		} finally {
			setDeleteId(null);
		}
	}

	function handleCloseForm() {
		setPlayerFormOpen(false);
		setEditingMatchPlayer(null);
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-AR', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}

	if (!match) return null;

	const resultType = getMatchResultType(match.result, match.home);
	const resultColor = getResultColor(resultType);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[160vh] max-h-[95vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl">Detalles del partido</DialogTitle>
					<DialogDescription>Información completa y estadísticas del partido</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					{/* Match Info Card */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Información general</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center gap-2">
								<Calendar className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">Fecha:</span>
								<span className="text-sm">{formatDate(match.date)}</span>
							</div>

							<div className="flex items-center gap-2">
								<Users className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">Contra:</span>
								<span className="text-sm font-semibold">{match.opponent}</span>
							</div>

							<div className="flex items-center gap-2">
								{match.home ? (
									<MapPin className="h-4 w-4 text-green-600" />
								) : (
									<MapPinOff className="h-4 w-4 text-muted-foreground" />
								)}
								<Badge
									variant={match.home ? 'default' : 'secondary'}
									className={match.home ? 'bg-green-600' : ''}
								>
									{match.home ? 'Local' : 'Visitante'}
								</Badge>
							</div>

							<div className="flex items-center gap-2">
								<span className="text-sm font-medium">Resultado:</span>
								<Badge variant="outline" className={`font-mono text-xs ${resultColor}`}>
									{match.result}
								</Badge>
								<Badge variant="outline" className={resultColor}>
									{resultType === 'win' ? 'Victoria' : resultType === 'draw' ? 'Empate' : 'Derrota'}
								</Badge>
							</div>

							<div className="flex items-center gap-2">
								<span className="text-sm font-medium">Árbitro:</span>
								<span className="text-sm">{match.referee || 'No especificado'}</span>
							</div>

							<div className="flex items-center gap-2">
								<span className="text-sm font-medium">Categoría:</span>
								<span className="text-sm">{match.category || 'No especificada'}</span>
							</div>
						</CardContent>
					</Card>

					{/* Players Card */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="text-lg">Jugadores participantes</CardTitle>
								<Button variant="outline" size="sm" onClick={() => setPlayerFormOpen(true)}>
									<Plus className="h-4 w-4 mr-2" />
									Agregar datos de jugador
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{loading ? (
								<div className="flex items-center justify-center py-8">
									<div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
								</div>
							) : matchPlayers.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-8">
									No hay jugadores registrados para este partido
								</p>
							) : (
								<div className="rounded-md border overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="w-[200px]">Jugador</TableHead>
												<TableHead className="text-center">Rol</TableHead>
												<TableHead className="text-center">Minutos</TableHead>
												<TableHead className="text-center">Goles</TableHead>
												<TableHead className="text-center">Asist.</TableHead>
												<TableHead className="text-center">TA</TableHead>
												<TableHead className="text-center">TR</TableHead>
												<TableHead className="text-center">Min. Ing.</TableHead>
												<TableHead className="text-center">Calif.</TableHead>
												<TableHead className="text-center w-[120px]">Acciones</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{matchPlayers.map((mp) => {
												const player = playerMap.get(mp.player_id);
												const playerName = player
													? `${player.name} ${player.last_name}`
													: `Jugador #${mp.player_id}`;

												return (
													<TableRow key={mp.id}>
														<TableCell className="font-medium">{playerName}</TableCell>
														<TableCell className="text-center">
															{mp.starter ? (
																<Badge variant="default" className="text-xs">
																	Titular
																</Badge>
															) : (
																<Badge variant="secondary" className="text-xs">
																	Suplente
																</Badge>
															)}
														</TableCell>
														<TableCell className="text-center">{mp.minutes_played}'</TableCell>
														<TableCell className="text-center">
															{mp.goals > 0 ? mp.goals : 0}
														</TableCell>
														<TableCell className="text-center">
															{mp.assists > 0 ? mp.assists : 0}
														</TableCell>
														<TableCell className="text-center">
															{mp.yellow_cards > 0 ? (
																<span className="inline-flex items-center justify-center">
																	🟨 {mp.yellow_cards}
																</span>
															) : (
																0
															)}
														</TableCell>
														<TableCell className="text-center">
															{mp.red_cards > 0 ? (
																<span className="inline-flex items-center justify-center">
																	🟥 {mp.red_cards}
																</span>
															) : (
																0
															)}
														</TableCell>
														<TableCell className="text-center">
															{mp.minute_login ? `${mp.minute_login}'` : 0}
														</TableCell>
														<TableCell className="text-center">
															{mp.calification !== null ? mp.calification : 0}
														</TableCell>
														<TableCell className="text-center">
															<div className="flex items-center justify-center gap-1">
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() => setEditingMatchPlayer(mp)}
																>
																	<Pencil className="h-4 w-4" />
																	<span className="sr-only">Editar</span>
																</Button>
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() => setDeleteId(mp.id)}
																>
																	<Trash2 className="h-4 w-4 text-destructive" />
																	<span className="sr-only">Eliminar</span>
																</Button>
															</div>
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</DialogContent>

			{/* Player Form Dialog */}
			<Dialog open={playerFormOpen} onOpenChange={handleCloseForm}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>
							{editingMatchPlayer ? 'Editar datos de jugador' : 'Agregar datos de jugador'}
						</DialogTitle>
						<DialogDescription>
							{editingMatchPlayer
								? 'Modifica las estadísticas del jugador'
								: 'Añade un jugador y sus estadísticas para este partido'}
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmitPlayer} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="category">Categoría</Label>
							<Select
								value={categoryFilter}
								onValueChange={(value) => {
									setCategoryFilter(value);
									// Clear player selection when category changes
									if (value !== 'all' && !editingMatchPlayer) {
										setFormData({ ...formData, player_id: 0 });
									}
								}}
							>
								<SelectTrigger id="category">
									<SelectValue placeholder="Filtrar por categoría" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todas las categorías</SelectItem>
									{categories.map((cat) => (
										<SelectItem key={cat} value={cat}>
											{cat}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="player">Jugador *</Label>
							<Select
								value={formData.player_id.toString()}
								onValueChange={(value) => setFormData({ ...formData, player_id: parseInt(value) })}
								disabled={!!editingMatchPlayer}
							>
								<SelectTrigger id="player">
									<SelectValue placeholder="Selecciona un jugador" />
								</SelectTrigger>
								<SelectContent>
									{availablePlayers.length === 0 ? (
										<div className="px-2 py-1.5 text-sm text-muted-foreground">
											No hay jugadores disponibles
										</div>
									) : (
										availablePlayers.map((player) => (
											<SelectItem key={player.id} value={player.id.toString()}>
												{player.name} {player.last_name}
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="minutes">Minutos jugados</Label>
								<Input
									id="minutes"
									type="number"
									min="0"
									value={formData.minutes_played ?? ''}
									onChange={(e) =>
										setFormData({ ...formData, minutes_played: e.target.value as any })
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="goals">Goles</Label>
								<Input
									id="goals"
									type="number"
									min="0"
									value={formData.goals ?? ''}
									onChange={(e) => setFormData({ ...formData, goals: e.target.value as any })}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="assists">Asistencias</Label>
								<Input
									id="assists"
									type="number"
									min="0"
									value={formData.assists ?? ''}
									onChange={(e) => setFormData({ ...formData, assists: e.target.value as any })}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="yellowCards">Tarjetas amarillas</Label>
								<Input
									id="yellowCards"
									type="number"
									min="0"
									value={formData.yellow_cards ?? ''}
									onChange={(e) =>
										setFormData({ ...formData, yellow_cards: e.target.value as any })
									}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="redCards">Tarjetas rojas</Label>
								<Input
									id="redCards"
									type="number"
									min="0"
									value={formData.red_cards ?? ''}
									onChange={(e) => setFormData({ ...formData, red_cards: e.target.value as any })}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="calification">Calificación (1-10)</Label>
								<Input
									id="calification"
									type="number"
									min="1"
									max="10"
									step="0.1"
									value={formData.calification ?? ''}
									onChange={(e) =>
										setFormData({ ...formData, calification: e.target.value as any })
									}
								/>
							</div>
						</div>

						<div className="flex items-center space-x-2">
							<Checkbox
								id="starter"
								checked={formData.starter}
								onCheckedChange={(checked) =>
									setFormData({
										...formData,
										starter: checked as boolean,
										minute_login: checked ? null : formData.minute_login,
									})
								}
							/>
							<Label htmlFor="starter" className="cursor-pointer">
								Jugador titular
							</Label>
						</div>

						{!formData.starter && (
							<div className="space-y-2">
								<Label htmlFor="minuteLogin">Minuto de ingreso</Label>
								<Input
									id="minuteLogin"
									type="number"
									min="0"
									value={formData.minute_login ?? ''}
									onChange={(e) =>
										setFormData({ ...formData, minute_login: e.target.value as any })
									}
								/>
							</div>
						)}

						<div className="flex justify-end gap-2 pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={handleCloseForm}
								disabled={submitting}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={submitting}>
								{submitting ? 'Guardando...' : editingMatchPlayer ? 'Actualizar' : 'Guardar'}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete confirmation */}
			<AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Eliminar jugador del partido</AlertDialogTitle>
						<AlertDialogDescription>
							¿Estás seguro que quieres eliminar este jugador del partido? Esta acción no se puede
							deshacer.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Dialog>
	);
}
