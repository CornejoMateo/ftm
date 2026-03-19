import { Trophy, Users, Target, HandHelping, AlertTriangle, Timer } from 'lucide-react';

export const teamStatCardsConfig = [
	{
		key: 'total_matches',
		title: 'Cantidad de partidos',
		icon: Trophy,
		color: 'text-primary',
	},
	{
		key: 'total_players',
		title: 'Cantidad de jugadores',
		icon: Users,
		color: 'text-chart-2',
	},
	{
		key: 'total_goals',
		title: 'Goles marcados',
		icon: Target,
		color: 'text-chart-3',
	},
	{
		key: 'total_assists',
		title: 'Total asistencias',
		icon: HandHelping,
		color: 'text-chart-1',
	},
	{
		key: 'total_yellow_cards',
		title: 'Tarjetas amarillas',
		icon: AlertTriangle,
		color: 'text-yellow-500',
	},
	{
		key: 'total_red_cards',
		title: 'Tarjetas rojas',
		icon: AlertTriangle,
		color: 'text-red-500',
	},
];
