'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
	LayoutDashboard,
	Users,
	BarChart3,
	GitCompareArrows,
	ClipboardList,
	CalendarRange,
	Menu,
	X,
	Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useYear } from '@/contexts/year-context';
import { fetchAvailableYears } from '@/lib/actions';

const navigation = [
	{ name: 'Panel', href: '/', icon: LayoutDashboard },
	{ name: 'Jugadores', href: '/players', icon: Users },
	{ name: 'Partidos', href: '/matchs', icon: ClipboardList },
	{ name: 'Reportes', href: '/reports', icon: BarChart3 },
	{ name: 'Reportes anuales', href: '/annual-reports', icon: CalendarRange },
	{ name: 'Comparación de jugadores', href: '/compare', icon: GitCompareArrows },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const [mobileOpen, setMobileOpen] = useState(false);
	const { selectedYear, setSelectedYear, availableYears, setAvailableYears } = useYear();

	useEffect(() => {
		// Only fetch if we don't have years yet
		if (availableYears.length === 0) {
			fetchAvailableYears().then((years) => {
				setAvailableYears(years);
			});
		}
	}, []);

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			{/* Mobile overlay */}
			{mobileOpen && (
				<div
					className="fixed inset-0 z-40 bg-foreground/30 lg:hidden"
					onClick={() => setMobileOpen(false)}
					onKeyDown={(e) => {
						if (e.key === 'Escape') setMobileOpen(false);
					}}
					role="button"
					tabIndex={0}
					aria-label="Close menu"
				/>
			)}

			{/* Sidebar */}
			<aside
				className={cn(
					'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 sm:w-64 lg:relative lg:w-64 lg:translate-x-0',
					mobileOpen ? 'translate-x-0' : '-translate-x-full'
				)}
			>
				<div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
					<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
						<BarChart3 className="h-5 w-5 text-sidebar-primary-foreground" />
					</div>
					<div>
						<h1 className="text-sm font-bold text-sidebar-primary-foreground">Futbol Manager</h1>
						<p className="text-xs text-sidebar-foreground/60">Tú equipo</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="ml-auto lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
						onClick={() => setMobileOpen(false)}
					>
						<X className="h-5 w-5" />
						<span className="sr-only">Cerrar menú</span>
					</Button>
				</div>

				<nav className="flex-1 px-3 py-4">
					<ul className="flex flex-col gap-1">
						{navigation.map((item) => {
							const isActive =
								item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
							return (
								<li key={item.name}>
									<Link
										href={item.href}
										onClick={() => setMobileOpen(false)}
										className={cn(
											'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors active:scale-[0.98] lg:py-2.5',
											isActive
												? 'bg-sidebar-accent text-sidebar-primary'
												: 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
										)}
									>
										<item.icon className="h-5 w-5" />
										{item.name}
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>

				<div className="border-t border-sidebar-border px-3 py-4 space-y-4">
					<div className="px-3">
						<label className="text-xs text-sidebar-foreground/50 mb-2 block">Filtrar por año</label>
						<Select
							value={selectedYear?.toString() ?? 'all'}
							onValueChange={(value) => setSelectedYear(value === 'all' ? null : parseInt(value))}
						>
							<SelectTrigger className="w-full bg-sidebar-accent text-sidebar-foreground border-sidebar-border">
								<Calendar className="h-4 w-4 mr-2" />
								<SelectValue placeholder="Seleccionar año" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos los años</SelectItem>
								{availableYears.map((year) => (
									<SelectItem key={year} value={year.toString()}>
										{year}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="border-t border-sidebar-border pt-4">
						<p className="px-3 text-xs text-sidebar-foreground/50">
							Futbol Manager - Versión 1.0.0
						</p>
					</div>
				</div>
			</aside>

			{/* Main content */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Top bar */}
				<header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6 lg:hidden">
					<Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
						<Menu className="h-5 w-5" />
						<span className="sr-only">Abrir menú</span>
					</Button>
				</header>

				{/* Page content */}
				<main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6">
					{children}
				</main>
			</div>
		</div>
	);
}
