'use client';

import { useEffect, useState, useCallback, useMemo, useRef, type ChangeEvent } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Search, Eye, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination';
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
import { addPlayer, fetchAllPlayers, removePlayer } from '@/lib/actions/players/player';
import PlayerForm from '@/components/players/player-form';
import type { PlayerWithAge } from '@/lib/db/players/player';
import { Badge } from '@/components/ui/badge';
import { formatDateForDb } from '@/utils/format-date';

const ITEMS_PER_PAGE = 10;

export default function PlayersContent({ initialPlayers }: { initialPlayers: PlayerWithAge[] }) {
	const [players, setPlayers] = useState(initialPlayers);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState('');
	const [categoryFilter, setCategoryFilter] = useState<string>('all');
	const [statusFilter, setStatusFilter] = useState<'all' | 'active'>('active');
	const [formOpen, setFormOpen] = useState(false);
	const [editingPlayer, setEditingPlayer] = useState<PlayerWithAge | null>(null);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [sortBy, setSortBy] = useState<'name' | 'age' | 'created'>('name');
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
	const [currentPage, setCurrentPage] = useState(1);
	const [importing, setImporting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	function parseBirthDate(rawDate: any): string {
		if (!rawDate) return '';

		// Excel number
		if (typeof rawDate === 'number') {
			const excelEpoch = new Date(Date.UTC(1899, 11, 30));
			const date = new Date(excelEpoch.getTime() + rawDate * 86400000);

			return date.toISOString().split('T')[0]; // YYYY-MM-DD
		}

		// Date object
		if (rawDate instanceof Date) {
			return rawDate.toISOString().split('T')[0]; //YYYY-MM-DD
		}

		// string dd/mm/yyyy
		const text = String(rawDate).trim();
		const [day, month, year] = text.split('/');

		if (!day || !month || !year) {
			throw new Error(`Fecha inválida: ${rawDate}`);
		}

		return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
	}

	async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;

		setImporting(true);
		try {
			const XLSX = await import('xlsx');
			const fileBuffer = await file.arrayBuffer();
			const workbook = XLSX.read(fileBuffer, { type: 'array' });
			const firstSheetName = workbook.SheetNames[0];

			if (!firstSheetName) {
				toast.error('El archivo no contiene hojas');
				return;
			}

			const rows = XLSX.utils.sheet_to_json<(string | number | Date)[]>(
				workbook.Sheets[firstSheetName],
				{ header: 1, defval: '' }
			);

			let imported = 0;
			let skipped = 0;

			for (let index = 0; index < rows.length; index++) {
				const row = rows[index];
				if (!Array.isArray(row)) continue;

				const rawLastName = row[0] ?? '';
				const rawName = row[1] ?? '';
				const rawCategory = row[2] ?? '';
				const rawDate = row[3] ?? '';
				const rawDni = row[4] ?? '';
				const rawPosition = row[5] ?? '';
				const rawAttendance = row[6] ?? '';

				const lastName = String(rawLastName).trim();
				const name = String(rawName).trim();
				const category = String(rawCategory).trim();
				const dateText = String(rawDate).trim();
				const dni = String(rawDni).trim();
				const position = String(rawPosition).trim();
				const attendanceText = String(rawAttendance).trim();
				const attendance = Number.parseInt(attendanceText, 10);

				console.log({
					index,
					name,
					lastName,
					dni,
					date: rawDate,
					parsed: parseBirthDate(rawDate),
				});

				if (!lastName && !name && !category && !dateText && !dni && !position && !attendanceText) {
					break;
				}

				const result = await addPlayer({
					last_name: lastName || '',
					name: name || '',
					category: category || '',
					date_of_birth: parseBirthDate(rawDate),
					dni: dni || '',
					position: position || null,
					attendance: Number.isNaN(attendance) ? 0 : attendance,
					active: true,
				});

				if (result.success) {
					imported++;
				} else {
					skipped++;
				}
			}

			if (imported > 0) {
				await load();
			}

			if (imported === 0 && skipped === 0) {
				toast.info('No se encontraron filas para importar');
			} else if (skipped > 0) {
				toast.success(`Importación finalizada: ${imported} importados, ${skipped} omitidos`);
			} else {
				toast.success(`Se importaron ${imported} jugadores`);
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error desconocido';
			toast.error(`Error al importar archivo: ${message}`);
		} finally {
			setImporting(false);
			event.target.value = '';
		}
	}

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const data = await fetchAllPlayers();
			setPlayers(data);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error desconocido';
			toast.error(`Error al cargar jugadores: ${message}`);
		} finally {
			setLoading(false);
		}
	}, []);

	// Extract unique categories for filter dropdown
	const categories = useMemo(() => {
		const uniqueCategories = new Set(
			players.map((p) => p.category).filter((c): c is string => !!c)
		);
		return Array.from(uniqueCategories).sort();
	}, [players]);

	function handleSort(field: 'name' | 'age' | 'created') {
		if (sortBy === field) {
			setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortBy(field);
			setSortDir('asc');
		}
	}

	const filtered = players
		.filter(
			(p) =>
				(`${p.name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
					(p.category && p.category.toLowerCase().includes(search.toLowerCase()))) &&
				(categoryFilter === 'all' || p.category === categoryFilter) &&
				(statusFilter === 'all' || (statusFilter === 'active' && p.active))
		)
		.sort((a, b) => {
			let cmp = 0;
			if (sortBy === 'name')
				cmp = `${a.name} ${a.last_name}`.localeCompare(`${b.name} ${b.last_name}`);
			if (sortBy === 'age') cmp = a.age - b.age;
			if (sortBy === 'created') cmp = a.created_at.localeCompare(b.created_at);
			return sortDir === 'desc' ? -cmp : cmp;
		});

	// Reset to page 1 when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [search, categoryFilter, statusFilter]);

	// Pagination calculations
	const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const endIndex = startIndex + ITEMS_PER_PAGE;
	const paginatedPlayers = filtered.slice(startIndex, endIndex);

	function handlePageChange(page: number) {
		setCurrentPage(page);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	async function handleDelete() {
		if (!deleteId) return;
		try {
			const result = await removePlayer(deleteId);
			if (result.success) {
				toast.success('Jugador eliminado exitosamente');
				await load();
			} else {
				toast.error('Error al eliminar jugador: ' + result.error);
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error desconocido';
			toast.error(`Error al eliminar jugador: ${message}`);
		} finally {
			setDeleteId(null);
		}
	}

	function sortIndicator(field: 'name' | 'age' | 'created') {
		if (sortBy !== field) return '';
		return sortDir === 'asc' ? ' ↑' : ' ↓';
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<>
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h3 className="text-2xl font-bold text-foreground">Jugadores</h3>
						<p className="text-sm text-muted-foreground">{players.length} jugadores registrados</p>
					</div>
					<div className="flex flex-col gap-2 sm:flex-row">
						<input
							ref={fileInputRef}
							type="file"
							accept=".xlsx,.xls"
							onChange={handleImportFile}
							className="hidden"
						/>
						<Button
							variant="outline"
							onClick={() => fileInputRef.current?.click()}
							disabled={importing}
						>
							<FileSpreadsheet className="mr-2 h-4 w-4" />
							{importing ? 'Importando...' : 'Importar jugadores'}
						</Button>
						<Button
							onClick={() => {
								setEditingPlayer(null);
								setFormOpen(true);
							}}
						>
							<Plus className="mr-2 h-4 w-4" />
							Agregar jugador
						</Button>
					</div>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Buscar por nombre o apellido..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-10"
						/>
					</div>
					<Select
						value={statusFilter}
						onValueChange={(value: 'all' | 'active') => setStatusFilter(value)}
					>
						<SelectTrigger className="w-full sm:w-[180px]">
							<SelectValue placeholder="Estado" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="active">Solo activos</SelectItem>
							<SelectItem value="all">Todos los jugadores</SelectItem>
						</SelectContent>
					</Select>
					<Select value={categoryFilter} onValueChange={setCategoryFilter}>
						<SelectTrigger className="w-full sm:w-[200px]">
							<SelectValue placeholder="Categoría" />
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
											onClick={() => handleSort('name')}
										>
											Nombre{sortIndicator('name')}
										</TableHead>
										<TableHead className="text-center">DNI</TableHead>
										<TableHead
											className="cursor-pointer select-none text-center"
											onClick={() => handleSort('age')}
										>
											Edad{sortIndicator('age')}
										</TableHead>
										<TableHead className="text-center">Posición</TableHead>
										<TableHead className="text-center">Categoría</TableHead>
										<TableHead className="text-center">Asistencia</TableHead>
										<TableHead className="text-center">Estado</TableHead>
										<TableHead className="text-center">Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filtered.length === 0 ? (
										<TableRow>
											<TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
												No hay jugadores registrados
											</TableCell>
										</TableRow>
									) : (
										paginatedPlayers.map((player) => (
											<TableRow key={player.id}>
												<TableCell className="font-medium text-center">
													{player.name} {player.last_name}
												</TableCell>
												<TableCell className="font-mono text-xs text-center">
													{player.dni}
												</TableCell>
												<TableCell className="text-center">{player.age} años</TableCell>
												<TableCell className="text-center">
													{player.position || <span className="text-muted-foreground">-</span>}
												</TableCell>
												<TableCell className="text-center">
													{player.category ? (
														<Badge variant="outline">{player.category}</Badge>
													) : (
														<span className="text-muted-foreground">-</span>
													)}
												</TableCell>
												<TableCell className="text-center">
													{player.attendance ? (
														<span className="font-medium">{player.attendance}%</span>
													) : (
														<span className="text-muted-foreground">-</span>
													)}
												</TableCell>
												<TableCell className="text-center">
													{player.active ? (
														<Badge variant="default" className="bg-green-600">
															Activo
														</Badge>
													) : (
														<Badge variant="secondary">Inactivo</Badge>
													)}
												</TableCell>
												<TableCell className="text-center">
													<div className="flex items-center justify-center gap-1">
														<Button variant="ghost" size="icon" asChild>
															<Link href={`/players/${player.id}`}>
																<Eye className="h-4 w-4" />
																<span className="sr-only">Ver jugador</span>
															</Link>
														</Button>
														<Button
															variant="ghost"
															size="icon"
															onClick={() => {
																setEditingPlayer(player);
																setFormOpen(true);
															}}
														>
															<Pencil className="h-4 w-4" />
															<span className="sr-only">Editar jugador</span>
														</Button>
														<Button
															variant="ghost"
															size="icon"
															onClick={() => setDeleteId(player.id)}
														>
															<Trash2 className="h-4 w-4 text-destructive" />
															<span className="sr-only">Eliminar jugador</span>
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
							{filtered.length === 0 ? (
								<p className="py-8 text-center text-muted-foreground">
									No hay jugadores registrados
								</p>
							) : (
								paginatedPlayers.map((player) => (
									<div
										key={player.id}
										className="flex flex-col gap-2 rounded-lg border border-border p-3"
									>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<div className="flex items-center gap-2">
													<p className="font-medium text-foreground">
														{player.name} {player.last_name}
													</p>
													{player.active ? (
														<Badge variant="default" className="bg-green-600 text-xs">
															Activo
														</Badge>
													) : (
														<Badge variant="secondary" className="text-xs">
															Inactivo
														</Badge>
													)}
												</div>
												<p className="text-xs text-muted-foreground mt-1">
													DNI: {player.dni} | Edad: {player.age} años
												</p>
												{(player.position || player.category) && (
													<p className="text-xs text-muted-foreground mt-1">
														{player.position && `${player.position}`}
														{player.position && player.category && ' | '}
														{player.category && (
															<span className="font-medium">{player.category}</span>
														)}
													</p>
												)}
												{player.attendance !== undefined && player.attendance !== null && (
													<p className="text-xs text-muted-foreground mt-1">
														Asistencia: <span className="font-medium">{player.attendance}%</span>
													</p>
												)}
											</div>
										</div>
										<div className="flex items-center justify-end gap-1 border-t pt-2">
											<Button variant="ghost" size="icon" asChild>
												<Link href={`/players/${player.id}`}>
													<Eye className="h-4 w-4" />
													<span className="sr-only">Ver jugador</span>
												</Link>
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => {
													setEditingPlayer(player);
													setFormOpen(true);
												}}
											>
												<Pencil className="h-4 w-4" />
												<span className="sr-only">Editar jugador</span>
											</Button>
											<Button variant="ghost" size="icon" onClick={() => setDeleteId(player.id)}>
												<Trash2 className="h-4 w-4 text-destructive" />
												<span className="sr-only">Eliminar jugador</span>
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
					<div className="flex flex-col items-center gap-2">
						<Pagination>
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										href="#"
										onClick={(e) => {
											e.preventDefault();
											if (currentPage > 1) handlePageChange(currentPage - 1);
										}}
										aria-disabled={currentPage === 1}
										className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
									/>
								</PaginationItem>
								{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
									<PaginationItem key={page}>
										<PaginationLink
											href="#"
											onClick={(e) => {
												e.preventDefault();
												handlePageChange(page);
											}}
											isActive={currentPage === page}
										>
											{page}
										</PaginationLink>
									</PaginationItem>
								))}
								<PaginationItem>
									<PaginationNext
										href="#"
										onClick={(e) => {
											e.preventDefault();
											if (currentPage < totalPages) handlePageChange(currentPage + 1);
										}}
										aria-disabled={currentPage === totalPages}
										className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
						<p className="text-sm text-muted-foreground">
							Mostrando {startIndex + 1}-{Math.min(endIndex, filtered.length)} de {filtered.length}{' '}
							jugadores
						</p>
					</div>
				)}
			</div>

			{/* Player form dialog */}
			{formOpen && (
				<PlayerForm
					key={editingPlayer?.id ?? 'new'}
					open={formOpen}
					onOpenChange={setFormOpen}
					player={editingPlayer}
					onSuccess={load}
				/>
			)}

			{/* Delete confirmation */}
			<AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Eliminar Jugador</AlertDialogTitle>
						<AlertDialogDescription>
							¿Estas seguro que quieres eliminar este jugador. Esta acción no se puede deshacer.
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
