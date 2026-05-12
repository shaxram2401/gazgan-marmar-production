import { NextRequest } from 'next/server';
export function verifyCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  // Vercel cron passes the secret as a header
  const headerToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const queryToken = req.nextUrl.searchParams.get('token');
  return headerToken === secret || queryToken === secret;
}
