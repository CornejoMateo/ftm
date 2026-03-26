export function formatDateForDb(date: Date) {
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, '0');
	const day = `${date.getDate()}`.padStart(2, '0');
	return `${day}-${month}-${year}`;
}

export function formatDateForDisplay(dateStr: string) {
	const [year, month, day] = dateStr.split('-');
	return `${day}-${month}-${year}`;
}
