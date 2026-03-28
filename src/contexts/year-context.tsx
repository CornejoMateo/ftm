'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';

interface YearContextType {
	selectedYear: number | null;
	setSelectedYear: (year: number | null) => void;
	availableYears: number[];
	setAvailableYears: (years: number[]) => void;
}

const YearContext = createContext<YearContextType | undefined>(undefined);
const STORAGE_KEY = 'ftm_selected_year';

export function YearProvider({ children }: { children: React.ReactNode }) {
	const [selectedYear, setSelectedYear] = useState<number | null>(null);
	const [availableYears, setAvailableYears] = useState<number[]>([]);
	const [isMounted, setIsMounted] = useState(false);

	// Initialize from localStorage on mount
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const year = JSON.parse(stored);
				setSelectedYear(year);
			} catch (error) {
				console.error('Error reading year from localStorage:', error);
			}
		}
		setIsMounted(true);
	}, []);

	// Save to localStorage whenever selectedYear changes
	useEffect(() => {
		if (isMounted) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedYear));
		}
	}, [selectedYear, isMounted]);

	const value = useMemo(
		() => ({
			selectedYear,
			setSelectedYear,
			availableYears,
			setAvailableYears,
		}),
		[selectedYear, availableYears]
	);

	return (
		<YearContext.Provider value={value}>
			{children}
		</YearContext.Provider>
	);
}

export function useYear() {
	const context = useContext(YearContext);
	if (context === undefined) {
		throw new Error('useYear must be used within a YearProvider');
	}
	return context;
}
