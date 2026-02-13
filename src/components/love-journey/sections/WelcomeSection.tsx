'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { Settings, Check, X as XIcon, Loader2, Heart, Stars, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { ref, onValue, set } from 'firebase/database';
import { rtdb } from '@/lib/firebase';

export function WelcomeSection() {
    const [mounted, setMounted] = useState(false);
    const [heartStyles, setHeartStyles] = useState<{ xStart: string, xEnd: string, duration: number, delay: number }[]>([]);
    const [days, setDays] = useState<number | null>(null);
    const [displayedDays, setDisplayedDays] = useState(0); // For animation
    const [isEditing, setIsEditing] = useState(false);
    const [tempDate, setTempDate] = useState('2024-02-14');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Tạo các giá trị ngẫu nhiên cố định sau khi mount để tránh Hydration Error
        setHeartStyles([...Array(6)].map((_, i) => ({
            xStart: Math.random() * 100 + "vw",
            xEnd: (Math.random() * 100 - 50) + "vw",
            duration: 15 + Math.random() * 10,
            delay: i * 2,
        })));

        const startRef = ref(rtdb, 'settings/loveStartDate');
        const unsubscribe = onValue(startRef, (snapshot) => {
            const val = snapshot.val();
            if (val) {
                setTempDate(val);
                // Simple day difference calculation
                const today = new Date();
                const startDate = new Date(val);
                const diffTime = Math.abs(today.getTime() - startDate.getTime());
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                setDays(diffDays + 1);
            }
        });
        return () => unsubscribe();
    }, []);

    // Animate counter from 0 to actual days with smooth easing
    useEffect(() => {
        if (days === null) return;

        const duration = 3500; // 3.5 seconds for smoother animation
        const startTime = Date.now();

        // Ease out cubic function for smooth deceleration
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(progress);

            const current = Math.floor(easedProgress * days);
            setDisplayedDays(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setDisplayedDays(days); // Ensure final value is exact
            }
        };

        requestAnimationFrame(animate);
    }, [days]);

    const handleSaveDate = async () => {
        setSaving(true);
        try {
            await set(ref(rtdb, 'settings/loveStartDate'), tempDate);
            setIsEditing(false);
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (!mounted) return null; // Tránh Hydration Mismatch

    return (
        <section className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#faf9f6] snap-start shrink-0" suppressHydrationWarning>
            {/* Mesh Gradient Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, 30, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-rose-100/30 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        x: [0, -40, 0],
                        y: [0, -50, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-indigo-100/30 rounded-full blur-[120px]"
                />
            </div>

            {/* Subtle Floating Hearts */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {heartStyles.map((style, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: "100vh", x: style.xStart }}
                        animate={{
                            opacity: [0, 0.5, 0],
                            y: "-10vh",
                            x: style.xEnd
                        }}
                        transition={{
                            duration: style.duration,
                            repeat: Infinity,
                            delay: style.delay,
                            ease: "linear"
                        }}
                        className="absolute"
                    >
                        <Heart className="w-4 h-4 text-rose-200 fill-rose-100/50" />
                    </motion.div>
                ))}
            </div>

            {/* Right Side Exploration Hint */}
            <div className="absolute top-1/2 right-8 -translate-y-1/2 z-20">
                <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5 }}
                    onClick={(e) => {
                        const container = e.currentTarget.closest('.snap-x');
                        if (container) {
                            container.scrollBy({ left: window.innerWidth, behavior: 'smooth' });
                        }
                    }}
                    className="group flex items-center gap-6 text-stone-300 hover:text-rose-500 transition-all"
                >
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] [writing-mode:vertical-lr] rotate-180 transition-colors">
                        Explore Our World
                    </span>

                    <div className="flex flex-col items-center gap-4">
                        <div className="w-px h-20 bg-gradient-to-b from-transparent via-stone-200 to-stone-200 group-hover:via-rose-200 transition-all" />
                        <motion.div
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            animate={{ x: [0, 5, 0] }}
                            transition={{ x: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
                            className="p-5 bg-white/40 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.05)] group-hover:shadow-rose-100 group-hover:border-rose-100 transition-all"
                        >
                            <ChevronRight className="w-6 h-6 text-stone-400 group-hover:text-rose-500" />
                        </motion.div>
                        <div className="w-px h-20 bg-gradient-to-t from-transparent via-stone-200 to-stone-200 group-hover:via-rose-200 transition-all" />
                    </div>
                </motion.button>
            </div>

            {/* Bottom-Left Settings Button */}
            <div className="absolute bottom-10 left-10 z-20">
                {!isEditing ? (
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsEditing(true)}
                        className="p-3 bg-white/40 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/50 text-stone-400 hover:text-rose-400 transition-colors"
                        title="Dành riêng cho bạn"
                    >
                        <Settings className="w-5 h-5" />
                    </motion.button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 bg-white/80 backdrop-blur-2xl p-4 rounded-[24px] border border-rose-100 shadow-2xl"
                    >
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Ngày bắt đầu</span>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={tempDate}
                                    onChange={(e) => setTempDate(e.target.value)}
                                    className="h-10 w-40 text-sm border-stone-100 bg-stone-50/50 rounded-xl focus:ring-rose-400 font-serif"
                                />
                                {tempDate && (
                                    <span className="absolute -bottom-5 left-1 text-[10px] text-rose-400 font-bold uppercase whitespace-nowrap">
                                        {format(new Date(tempDate), 'MMMM dd, yyyy')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 self-end">
                            <Button size="icon" onClick={handleSaveDate} disabled={saving} className="h-10 w-10 rounded-xl bg-stone-900 hover:bg-black shadow-lg shadow-stone-100">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Check className="w-4 h-4 text-white" />}
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)} className="h-10 w-10 rounded-xl hover:bg-stone-100">
                                <XIcon className="w-4 h-4 text-stone-400" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="z-10 text-center space-y-12"
            >
                <div className="relative">
                    {/* Artistic Orbital Ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 -m-8 border border-dashed border-rose-200/50 rounded-full"
                    />

                    {/* Decorative Sparkles orbiting */}
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                rotate: 360,
                                scale: [0.8, 1.2, 0.8]
                            }}
                            transition={{
                                rotate: { duration: 10 + i * 2, repeat: Infinity, ease: "linear" },
                                scale: { duration: 2, repeat: Infinity, delay: i * 0.5 }
                            }}
                            className="absolute inset-0 -m-8 pointer-events-none"
                            style={{ rotate: i * 120 }}
                        >
                            <Stars className="text-yellow-400/60 w-4 h-4 absolute top-0 left-1/2 -translate-x-1/2" />
                        </motion.div>
                    ))}

                    {/* Central Glowing Heart */}
                    <motion.div
                        animate={{
                            y: [0, -15, 0],
                            scale: [1, 1.05, 1]
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="relative z-10 flex items-center justify-center"
                    >
                        <Heart className="w-24 h-24 text-rose-500 fill-rose-500 filter drop-shadow-[0_0_20px_rgba(244,63,94,0.4)]" />

                        {/* Multiple glow layers */}
                        <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute w-32 h-32 bg-rose-400/20 rounded-full blur-3xl -z-10"
                        />
                    </motion.div>
                </div>

                <div className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center justify-center gap-4"
                    >
                        <div className="h-px w-8 bg-stone-200" />
                        <h2 className="text-sm md:text-base font-bold text-stone-400 tracking-[0.3em] uppercase">Together For</h2>
                        <div className="h-px w-8 bg-stone-200" />
                    </motion.div>

                    <motion.h1
                        key={displayedDays}
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 0.3 }}
                        className="text-8xl md:text-[12rem] font-serif font-black text-stone-800 tracking-tighter leading-none"
                    >
                        {displayedDays}
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="flex flex-col items-center gap-2"
                    >
                        <p className="text-2xl md:text-3xl font-serif italic text-stone-500">
                            Days of Love
                        </p>
                        {tempDate && (
                            <p className="text-sm font-['Montserrat'] uppercase tracking-widest text-stone-400 font-bold">
                                Since {format(new Date(tempDate), 'MMMM dd, yyyy')}
                            </p>
                        )}
                    </motion.div>

                </div>
            </motion.div>
        </section >
    );
}
