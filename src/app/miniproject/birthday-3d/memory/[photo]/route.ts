import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/verify-session';
import { birthdayUnlockAt } from '@/components/love-journey/miniprojects/birthday/birthday-release';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const photos = {
    first: () => readFile(join(process.cwd(), 'src/components/love-journey/miniprojects/birthday/private/memory-1.webp')),
    third: () => readFile(join(process.cwd(), 'src/components/love-journey/miniprojects/birthday/private/memory-3.webp')),
};
const cacheHeaders = { 'Cache-Control': 'private, no-store' };

export async function GET(_request: Request, { params }: { params: Promise<{ photo: string }> }) {
    const { photo } = await params;
    if ((photo !== 'first' && photo !== 'third') || Date.now() < birthdayUnlockAt) {
        return new Response(null, { status: 404, headers: cacheHeaders });
    }

    const token = (await cookies()).get('session_token')?.value;
    if (!await verifySessionToken(token)) return new Response(null, { status: 404, headers: cacheHeaders });

    const image = await photos[photo]();
    return new Response(new Uint8Array(image), {
        headers: { ...cacheHeaders, 'Content-Type': 'image/webp' },
    });
}
