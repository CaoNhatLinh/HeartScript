'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setLoading, user } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);

            // Basic route protection
            if (!currentUser && pathname.startsWith('/dashboard')) {
                router.push('/');
            } else if (currentUser && pathname === '/') {
                router.push('/dashboard');
            }
        });

        return () => unsubscribe();
    }, [setUser, setLoading, router, pathname]);

    return <>{children}</>;
}
