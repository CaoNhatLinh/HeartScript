'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function createSession(token: string) {
    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 5, // 5 days
        path: '/',
    });

    // We don't redirect here to allow the client to handle the UI transition 
    // or we can redirect if the form action pattern is strictly used.
    // For now, simpler to just set cookie.
}

export async function removeSession() {
    const cookieStore = await cookies();
    cookieStore.delete('session_token');
    redirect('/');
}
