'use client';

import React from 'react';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { addPlayer, editPlayer } from '@/lib/actions';
import type { PlayerWithAge } from '@/lib/players/player';
import { playerPositions } from '@/constants/player-positions';

interface PlayerFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	player?: PlayerWithAge | null;
	onSuccess: () => void;
}

export default function PlayerForm({ open, onOpenChange, player, onSuccess }: PlayerFormProps) {
	const [loading, setLoading] = useState(false);
	const [name, setName] = useState(player?.name ?? '');
	const [lastName, setLastName] = useState(player?.last_name ?? '');
	const [dni, setDni] = useState(player?.dni ?? '');
	const [position, setPosition] = useState(player?.position ?? '');
	const [active, setActive] = useState(player?.active ?? true);
	const [dateOfBirth, setDateOfBirth] = useState(player?.date_of_birth ?? '');
	const [category, setCategory] = useState(player?.category ?? '');
	const [attendance, setAttendance] = useState<number | string>(player?.attendance ?? '');

	const isEdit = !!player;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim() || !lastName.trim() || !dni.trim() || !dateOfBirth) {
			toast.error('Nombre, apellido, DNI y fecha de nacimiento son requeridos');
			return;
		}
		setLoading(true);
		try {
			if (isEdit && player) {
				await editPlayer(player.id, {
					name,
					last_name: lastName,
					dni,
					position: position || null,
					active,
					date_of_birth: dateOfBirth,
					category: category || '',
					attendance: attendance ? Number(attendance) : 0,
				});
				toast.success('Jugador actualizado exitosamente');
			} else {
				await addPlayer({
					name,
					last_name: lastName,
					dni,
					position: position || null,
					active,
					date_of_birth: dateOfBirth,
					category: category || '',
					attendance: attendance ? Number(attendance) : 0,
				});
				toast.success('Jugador creado exitosamente');
			}
			onSuccess();
			onOpenChange(false);
		} catch (error: any) {
			toast.error(error.message || 'Error al guardar el jugador');
		} finally {
			setLoading(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[700px]">
				<DialogHeader>
					<DialogTitle>{isEdit ? 'Editar jugador' : 'Agregar jugador'}</DialogTitle>
					<DialogDescription>
						{isEdit
							? 'Actualiza la información del jugador.'
							: 'Completa los detalles para agregar un nuevo jugador.'}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="name">Nombre</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ingrese nombre"
							required
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="lastName">Apellido</Label>
						<Input
							id="lastName"
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							placeholder="Ingrese apellido"
							required
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="dni">DNI</Label>
						<Input id="dni" value={dni} onChange={(e) => setDni(e.target.value)} required />
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
						<Input
							id="dateOfBirth"
							type="date"
							value={dateOfBirth}
							onChange={(e) => setDateOfBirth(e.target.value)}
							required
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="position">Posición</Label>
						<Select value={position || ''} onValueChange={setPosition}>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona una posición" />
							</SelectTrigger>
							<SelectContent>
								{playerPositions.map((pos) => (
									<SelectItem key={pos.value} value={pos.value}>
										{pos.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="category">Categoría</Label>
						<Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="attendance">Asistencia (%)</Label>
						<Input
							id="attendance"
							type="number"
							min="0"
							max="100"
							value={attendance}
							onChange={(e) => setAttendance(e.target.value)}
							placeholder="0-100"
						/>
					</div>
					<div className="flex items-center gap-2">
						<Checkbox
							id="active"
							checked={active}
							onCheckedChange={(checked) => setActive(checked as boolean)}
						/>
						<Label htmlFor="active" className="cursor-pointer">
							Activo
						</Label>
					</div>
					<DialogFooter className="md:col-span-2">
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Cancelar
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
