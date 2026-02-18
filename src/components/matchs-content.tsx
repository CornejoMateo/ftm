'use client';

import { useEffect, useState, useCallback } from 'react';
import {
	Plus,
	Pencil,
	Trash2,
	Search,
	Calendar,
	MapPin,
	MapPinOff,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
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
import { toast } from 'sonner';
import { fetchAllMatches, removeMatch } from '@/lib/actions';
import MatchForm from '@/components/match-form';
import MatchDetails from '@/components/match-details';
import type { Match } from '@/lib/matchs/match';
import { Badge } from '@/components/ui/badge';

export default function MatchsContent() {
	const [matches, setMatches] = useState<Match[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [categoryFilter, setCategoryFilter] = useState<string>('all');
	const [formOpen, setFormOpen] = useState(false);
	const [editingMatch, setEditingMatch] = useState<Match | null>(null);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [sortBy, setSortBy] = useState<'date' | 'opponent'>('date');
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		const data = await fetchAllMatches();
		setMatches(data);
		setLoading(false);
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	// Reset page when search or category filter changes
	useEffect(() => {
		setCurrentPage(1);
	}, [search, categoryFilter]);

	function handleSort(field: 'date' | 'opponent') {
		if (sortBy === field) {
			setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortBy(field);
			setSortDir(field === 'date' ? 'desc' : 'asc');
		}
	}

	// Get unique categories
	const categories = Array.from(new Set(matches.map((m) => m.category).filter(Boolean)));

	const filtered = matches
		.filter(
			(m) =>
				(m.opponent.toLowerCase().includes(search.toLowerCase()) ||
					m.referee.toLowerCase().includes(search.toLowerCase()) ||
					m.result.toLowerCase().includes(search.toLowerCase())) &&
				(categoryFilter === 'all' || m.category === categoryFilter)
		)
		.sort((a, b) => {
			let cmp = 0;
			if (sortBy === 'date') cmp = a.date.localeCompare(b.date);
			if (sortBy === 'opponent') cmp = a.opponent.localeCompare(b.opponent);
			return sortDir === 'desc' ? -cmp : cmp;
		});

	// Pagination calculations
	const totalPages = Math.ceil(filtered.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const paginatedMatches = filtered.slice(startIndex, endIndex);

	function goToPage(page: number) {
		setCurrentPage(Math.max(1, Math.min(page, totalPages)));
	}

	function handleViewDetails(match: Match) {
		setSelectedMatch(match);
		setDetailsOpen(true);
	}

	async function handleDelete() {
		if (!deleteId) return;
		const result = await removeMatch(deleteId);
		if (result.success) {
			toast.success('Partido eliminado exitosamente');
			load();
		} else {
			toast.error('Error al eliminar partido: ' + result.error);
		}
		setDeleteId(null);
	}

	function sortIndicator(field: 'date' | 'opponent') {
		if (sortBy !== field) return '';
		return sortDir === 'asc' ? ' ↑' : ' ↓';
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-AR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	function getMatchResultType(result: string, home: boolean): 'win' | 'draw' | 'loss' | 'unknown' {
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

	function getResultColor(resultType: 'win' | 'draw' | 'loss' | 'unknown'): string {
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

	return (
		<>
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h3 className="text-2xl font-bold text-foreground">Partidos</h3>
						<p className="text-sm text-muted-foreground">
							{filtered.length} partidos registrados
							{filtered.length !== matches.length && ` (${matches.length} totales)`}
						</p>
					</div>
					<Button
						onClick={() => {
							setEditingMatch(null);
							setFormOpen(true);
						}}
					>
						<Plus className="mr-2 h-4 w-4" />
						Agregar partido
					</Button>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Buscar por oponente, resultado o árbitro..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-10"
						/>
					</div>
					<Select value={categoryFilter} onValueChange={setCategoryFilter}>
						<SelectTrigger className="w-full sm:w-[200px]">
							<SelectValue placeholder="Todas las categorías" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Todas las categorías</SelectItem>
							{categories.map((category) => (
								<SelectItem key={category} value={category}>
									{category}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<Card>
					<CardContent className="p-0">
						{/* Desktop table */}
						<div className="hidden md:block">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead
											className="cursor-pointer select-none text-center"
											onClick={() => handleSort('date')}
										>
											Fecha{sortIndicator('date')}
										</TableHead>
										<TableHead
											className="cursor-pointer select-none text-center"
											onClick={() => handleSort('opponent')}
										>
											Oponente{sortIndicator('opponent')}
										</TableHead>
										<TableHead className="text-center">Resultado</TableHead>
										<TableHead className="text-center">Árbitro</TableHead>
										<TableHead className="text-center">Local/Visitante</TableHead>
										<TableHead className="text-center">Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{paginatedMatches.length === 0 ? (
										<TableRow>
											<TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
												{filtered.length === 0
													? 'No hay partidos registrados'
													: 'No hay resultados'}
											</TableCell>
										</TableRow>
									) : (
										paginatedMatches.map((match) => (
											<TableRow
												key={match.id}
												className="cursor-pointer hover:bg-muted/50"
												onClick={() => handleViewDetails(match)}
											>
												<TableCell className="text-center">
													<div className="flex items-center justify-center gap-1">
														<Calendar className="h-4 w-4 text-muted-foreground" />
														<span>{formatDate(match.date)}</span>
													</div>
												</TableCell>
												<TableCell className="font-medium text-center">{match.opponent}</TableCell>
												<TableCell className="text-center">
													<Badge
														variant="outline"
														className={`font-mono ${getResultColor(getMatchResultType(match.result, match.home))}`}
													>
														{match.result}
													</Badge>
												</TableCell>
												<TableCell className="text-center">
													{match.referee ? match.referee : '-'}
												</TableCell>
												<TableCell className="text-center">
													{match.home ? (
														<Badge variant="default" className="bg-green-600">
															<MapPin className="mr-1 h-3 w-3" />
															Local
														</Badge>
													) : (
														<Badge variant="secondary">
															<MapPinOff className="mr-1 h-3 w-3" />
															Visitante
														</Badge>
													)}
												</TableCell>
												<TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
													<div className="flex items-center justify-center gap-1">
														<Button
															variant="ghost"
															size="icon"
															onClick={() => {
																setEditingMatch(match);
																setFormOpen(true);
															}}
														>
															<Pencil className="h-4 w-4" />
															<span className="sr-only">Editar partido</span>
														</Button>
														<Button
															variant="ghost"
															size="icon"
															onClick={() => setDeleteId(match.id)}
														>
															<Trash2 className="h-4 w-4 text-destructive" />
															<span className="sr-only">Eliminar partido</span>
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
						<div className="flex flex-col gap-2 p-4 md:hidden">
							{paginatedMatches.length === 0 ? (
								<p className="py-8 text-center text-muted-foreground">
									{filtered.length === 0 ? 'No hay partidos registrados' : 'No hay resultados'}
								</p>
							) : (
								paginatedMatches.map((match) => (
									<div
										key={match.id}
										className="flex flex-col gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50"
										onClick={() => handleViewDetails(match)}
									>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<div className="flex items-center gap-2">
													<p className="font-medium text-foreground">{match.opponent}</p>
													{match.home ? (
														<Badge variant="default" className="bg-green-600 text-xs">
															<MapPin className="mr-1 h-3 w-3" />
															Local
														</Badge>
													) : (
														<Badge variant="secondary" className="text-xs">
															<MapPinOff className="mr-1 h-3 w-3" />
															Visitante
														</Badge>
													)}
												</div>
												<div className="flex items-center gap-1 mt-1">
													<Calendar className="h-3 w-3 text-muted-foreground" />
													<p className="text-xs text-muted-foreground">{formatDate(match.date)}</p>
												</div>
												<div className="flex items-center gap-1 mt-1">
													<span className="text-xs text-muted-foreground">Resultado:</span>
													<Badge
														variant="outline"
														className={`font-mono text-xs ${getResultColor(getMatchResultType(match.result, match.home))}`}
													>
														{match.result}
													</Badge>
												</div>
												<p className="text-xs text-muted-foreground mt-1">
													Árbitro: {match.referee}
												</p>
											</div>
										</div>
										<div
											className="flex items-center justify-end gap-1 border-t pt-2"
											onClick={(e) => e.stopPropagation()}
										>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => {
													setEditingMatch(match);
													setFormOpen(true);
												}}
											>
												<Pencil className="h-4 w-4" />
												<span className="sr-only">Editar partido</span>
											</Button>
											<Button variant="ghost" size="icon" onClick={() => setDeleteId(match.id)}>
												<Trash2 className="h-4 w-4 text-destructive" />
												<span className="sr-only">Eliminar partido</span>
											</Button>
										</div>
									</div>
								))
							)}
						</div>
					</CardContent>
				</Card>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between gap-2">
						<p className="text-sm text-muted-foreground">
							Mostrando {startIndex + 1}-{Math.min(endIndex, filtered.length)} de {filtered.length}
						</p>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="icon"
								onClick={() => goToPage(currentPage - 1)}
								disabled={currentPage === 1}
							>
								<ChevronLeft className="h-4 w-4" />
								<span className="sr-only">Página anterior</span>
							</Button>

							<div className="flex items-center gap-1">
								{Array.from({ length: totalPages }, (_, i) => i + 1)
									.filter((page) => {
										// Show first page, last page, current page, and pages around current
										return (
											page === 1 ||
											page === totalPages ||
											(page >= currentPage - 1 && page <= currentPage + 1)
										);
									})
									.map((page, index, array) => (
										<div key={page} className="flex items-center gap-1">
											{index > 0 && array[index - 1] !== page - 1 && (
												<span className="px-2 text-muted-foreground">...</span>
											)}
											<Button
												variant={currentPage === page ? 'default' : 'outline'}
												size="icon"
												onClick={() => goToPage(page)}
												className="w-10"
											>
												{page}
											</Button>
										</div>
									))}
							</div>

							<Button
								variant="outline"
								size="icon"
								onClick={() => goToPage(currentPage + 1)}
								disabled={currentPage === totalPages}
							>
								<ChevronRight className="h-4 w-4" />
								<span className="sr-only">Página siguiente</span>
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Match form dialog */}
			{formOpen && (
				<MatchForm
					key={editingMatch?.id ?? 'new'}
					open={formOpen}
					onOpenChange={setFormOpen}
					match={editingMatch}
					onSuccess={load}
				/>
			)}
			<MatchDetails match={selectedMatch} open={detailsOpen} onOpenChange={setDetailsOpen} />
			{/* Delete confirmation */}
			<AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Eliminar Partido</AlertDialogTitle>
						<AlertDialogDescription>
							¿Estás seguro que quieres eliminar este partido? Esta acción no se puede deshacer.
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
		</>
	);
}
