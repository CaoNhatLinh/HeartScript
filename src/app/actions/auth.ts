'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken } from '@/lib/verify-session';

export async function createSession(token: string) {
    const user = await verifySessionToken(token);
    if (!user) return false;
    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(user.exp * 1000),
        path: '/',
    });

    return true;
    // For now, simpler to just set cookie.
}

export async function removeSession() {
    const cookieStore = await cookies();
    cookieStore.delete('session_token');
    redirect('/');
}
