'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';

interface YearContextType {
	selectedYear: number | null;
	setSelectedYear: (year: number | null) => void;
	availableYears: number[];
	setAvailableYears: (years: number[]) => void;
}

const YearContext = createContext<YearContextType | undefined>(undefined);

export function YearProvider({ children }: { children: React.ReactNode }) {
	const [selectedYear, setSelectedYear] = useState<number | null>(null);
	const [availableYears, setAvailableYears] = useState<number[]>([]);

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
