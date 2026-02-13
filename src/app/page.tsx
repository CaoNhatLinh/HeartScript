'use client';

import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createSession } from '@/app/actions/auth';
import { ALLOWED_EMAILS } from '@/lib/constants';
import { Heart, Cloud, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
    const [loading, setLoading] = useState<'him' | 'her' | null>(null);
    const [error, setError] = useState('');
    const [particles, setParticles] = useState<{ x: number; y: number; duration: number; delay: number }[]>([]);
    const router = useRouter();

    useEffect(() => {
        // Delay slightly to satisfy linter rule about synchronous state updates in effect
        const timer = setTimeout(() => {
            setParticles(
                Array.from({ length: 20 }).map(() => ({
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    duration: 5 + Math.random() * 5,
                    delay: Math.random() * 5,
                }))
            );
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const handleLogin = async (role: 'him' | 'her') => {
        setLoading(role);
        setError('');

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            if (user.email && ALLOWED_EMAILS.includes(user.email)) {
                // Whitelisted
                const token = await user.getIdToken();
                await createSession(token);

                // Add a small delay for emotion
                setTimeout(() => {
                    router.push('/dashboard');
                }, 800);
            } else {
                await auth.signOut();
                setError('Oops! You are not on the love list.');
                setLoading(null);
            }

        } catch (err: unknown) {
            console.error(err);
            setError('Failed to enter our world.');
            setLoading(null);
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black flex flex-col md:flex-row font-sans" suppressHydrationWarning>
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 flex pointer-events-none">
                <div className="w-1/2 h-full bg-gradient-to-br from-slate-900 to-blue-950 relative overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
                </div>
                <div className="w-1/2 h-full bg-gradient-to-bl from-rose-950 to-slate-900 relative overflow-hidden">
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                {particles.map((p, i) => (
                    <motion.div
                        key={i}
                        initial={{
                            x: p.x,
                            y: p.y,
                            opacity: 0,
                            scale: 0.5
                        }}
                        animate={{
                            y: [null, -100],
                            opacity: [0, 0.5, 0],
                        }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            delay: p.delay
                        }}
                        className={cn(
                            "absolute w-2 h-2 rounded-full",
                            i % 2 === 0 ? "bg-blue-400 blur-sm" : "bg-pink-400 blur-sm"
                        )}
                    />
                ))}
            </div>

            {/* Error Message - Responsive positioning */}
            <div className="absolute top-0 w-full z-50 flex justify-center pt-4 md:pt-8 pointer-events-none px-4">
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-red-500/90 backdrop-blur-md px-4 md:px-6 py-2 md:py-3 rounded-full text-white text-xs md:text-sm font-medium shadow-lg max-w-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* LEFT SIDE (HIM) - Responsive */}
            <motion.div
                className="relative flex-1 h-1/2 md:h-full flex items-center justify-center group cursor-pointer overflow-hidden"
                whileHover={{ flexGrow: 1.3, zIndex: 20 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 150, damping: 25 }}
                onClick={() => !loading && handleLogin('him')}
            >
                <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-600/10 transition-colors duration-500" />
                <div className="text-center space-y-3 md:space-y-4 opacity-80 md:opacity-60 group-hover:opacity-100 transition-all transform group-hover:scale-105 md:group-hover:scale-110 duration-500 relative z-20 px-4">
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30"
                    >
                        {loading === 'him' ? (
                            <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-white animate-spin" />
                        ) : (
                            <Cloud className="w-8 h-8 md:w-10 md:h-10 text-white fill-white/20" />
                        )}
                    </motion.div>
                    <div>
                        <h2 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-indigo-200">Anh</h2>
                        <p className="text-blue-100/60 font-medium tracking-wide text-[8px] md:text-[10px] uppercase mt-1">Journey for Him</p>
                    </div>
                </div>
            </motion.div>

            {/* RIGHT SIDE (HER) - Responsive */}
            <motion.div
                className="relative flex-1 h-1/2 md:h-full flex items-center justify-center group cursor-pointer overflow-hidden"
                whileHover={{ flexGrow: 1.3, zIndex: 20 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 150, damping: 25 }}
                onClick={() => !loading && handleLogin('her')}
            >
                <div className="absolute inset-0 bg-pink-500/0 group-hover:bg-pink-600/10 transition-colors duration-500" />
                <div className="text-center space-y-3 md:space-y-4 opacity-80 md:opacity-60 group-hover:opacity-100 transition-all transform group-hover:scale-105 md:group-hover:scale-110 duration-500 relative z-20 px-4">
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-bl from-pink-500 to-rose-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-pink-500/30"
                    >
                        {loading === 'her' ? (
                            <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-white animate-spin" />
                        ) : (
                            <Heart className="w-8 h-8 md:w-10 md:h-10 text-white fill-white/20" />
                        )}
                    </motion.div>
                    <div>
                        <h2 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-l from-pink-100 to-rose-200">Em</h2>
                        <p className="text-pink-100/60 font-medium tracking-wide text-[8px] md:text-[10px] uppercase mt-1">Journey for Her</p>
                    </div>
                </div>
            </motion.div>

            {/* CENTRAL VISUAL ELEMENT */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none mix-blend-overlay">
                <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="w-48 h-48 bg-white/20 blur-[60px] rounded-full"
                />
            </div>
        </div>
    );
}
