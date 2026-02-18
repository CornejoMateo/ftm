'use client';

import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { addMatch, editMatch } from '@/lib/actions';
import type { Match } from '@/lib/matchs/match';

interface MatchFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	match?: Match | null;
	onSuccess: () => void;
}

export default function MatchForm({ open, onOpenChange, match, onSuccess }: MatchFormProps) {
	const [loading, setLoading] = useState(false);
	const [opponent, setOpponent] = useState(match?.opponent ?? '');
	const [result, setResult] = useState(match?.result ?? '');
	const [referee, setReferee] = useState(match?.referee ?? '');
	const [date, setDate] = useState(match?.date ?? '');
	const [home, setHome] = useState(match?.home ?? true);

	const isEdit = !!match;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!opponent.trim() || !result.trim() || !date) {
			toast.error('Todos los campos son requeridos');
			return;
		}
		setLoading(true);
		try {
			if (isEdit && match) {
				await editMatch(match.id, {
					opponent,
					result,
					referee,
					date,
					home,
				});
				toast.success('Partido actualizado exitosamente');
			} else {
				await addMatch({
					opponent,
					result,
					referee,
					date,
					home,
				});
				toast.success('Partido creado exitosamente');
			}
			onSuccess();
			onOpenChange(false);
		} catch (error: any) {
			toast.error(error.message || 'Error al guardar el partido');
		} finally {
			setLoading(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>{isEdit ? 'Editar partido' : 'Agregar partido'}</DialogTitle>
					<DialogDescription>
						{isEdit
							? 'Actualiza la información del partido.'
							: 'Completa los detalles para agregar un nuevo partido.'}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="opponent">Oponente</Label>
						<Input
							id="opponent"
							value={opponent}
							onChange={(e) => setOpponent(e.target.value)}
							placeholder="Nombre del equipo rival"
							required
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="result">Resultado</Label>
						<Input
							id="result"
							value={result}
							onChange={(e) => setResult(e.target.value)}
							placeholder="Ej: 2-1, 0-0"
							required
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="referee">Árbitro</Label>
						<Input
							id="referee"
							value={referee}
							onChange={(e) => setReferee(e.target.value)}
							placeholder="Nombre del árbitro"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="date">Fecha</Label>
						<Input
							id="date"
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							required
						/>
					</div>
					<div className="flex items-center gap-2 md:col-span-2">
						<Checkbox
							id="home"
							checked={home}
							onCheckedChange={(checked) => setHome(checked as boolean)}
						/>
						<Label htmlFor="home" className="cursor-pointer">
							Partido de local
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
