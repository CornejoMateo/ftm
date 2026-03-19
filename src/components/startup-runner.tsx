'use client';

import { useEffect } from 'react';

export function StartupRunner() {
	useEffect(() => {
		fetch('/api/startup');
	}, []);

	return null;
}
