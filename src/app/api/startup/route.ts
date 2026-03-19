import { startup } from '@/lib/startup';

export async function GET() {
	await startup();

	return Response.json({
		status: 'ok',
	});
}
