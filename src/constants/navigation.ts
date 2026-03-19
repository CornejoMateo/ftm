import {
	BarChart3,
	CalendarRange,
	ClipboardList,
	GitCompareArrows,
	LayoutDashboard,
	Users,
} from 'lucide-react';

export const navigation = [
	{ name: 'Panel', href: '/', icon: LayoutDashboard },
	{ name: 'Jugadores', href: '/players', icon: Users },
	{ name: 'Partidos', href: '/matchs', icon: ClipboardList },
	/* 	{ name: 'Reportes', href: '/reports', icon: BarChart3 },
	{ name: 'Reportes anuales', href: '/annual-reports', icon: CalendarRange },
	{ name: 'Comparación de jugadores', href: '/compare', icon: GitCompareArrows }, */
];
