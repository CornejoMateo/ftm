'use client';

import { useEffect } from 'react';

export function StartupRunner() {
	useEffect(() => {
		async function runStartup() {
			try {
				await fetch('/api/startup');
			} catch (error) {
				console.error('Error running startup endpoint:', error);
			}
		}

		runStartup();
	}, []);

	return null;
}
