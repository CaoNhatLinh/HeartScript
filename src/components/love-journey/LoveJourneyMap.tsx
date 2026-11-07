'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
    Home,
    BookOpen,
    Images,
    Heart,
    Sparkles,
    LogOut,
    Pencil,
    Check,
    X,
    Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WelcomeSection } from './sections/WelcomeSection';
import { DiarySection } from './sections/DiarySection';
import { MemoriesSection } from './sections/MemoriesSection';
import { ProjectsSection } from './sections/ProjectsSection';
import { useAuthStore } from '@/store/useAuthStore';
import { auth } from '@/lib/firebase';
import { signOut, updateProfile, User } from 'firebase/auth';
import { removeSession } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useWheelSections } from './useWheelSections';

const COUPLE_AVATAR = "/couple-art.png";

export default function LoveJourneyMap() {
    const { user, setUser } = useAuthStore();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user?.displayName || '');
    const [updating, setUpdating] = useState(false);
    const reduceMotion = useReducedMotion();

    const containerRef = useRef<HTMLDivElement>(null);

    // useScroll for the progress bar
    const { scrollXProgress } = useScroll({
        container: containerRef
    });

    const [activeIndex, setActiveIndex] = useState(0);
    const scaleX = useTransform(scrollXProgress, [0, 1], [0, 1]);

    const handleUpdateName = async () => {
        if (!auth.currentUser || !newName.trim()) return;
        setUpdating(true);
        try {
            await updateProfile(auth.currentUser, { displayName: newName });
            setUser(auth.currentUser as User);
            setIsEditingName(false);
        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !auth.currentUser) return;

        setUpdating(true);
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "upload_social";

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                { method: 'POST', body: formData }
            );

            const data = await response.json();
            if (data.secure_url) {
                await updateProfile(auth.currentUser, { photoURL: data.secure_url });
                setUser(auth.currentUser as User);
            }
        } catch (error) {
            console.error("Avatar upload failed:", error);
        } finally {
            setUpdating(false);
        }
    };

    const scrollToSection = useCallback((index: number) => {
        const container = containerRef.current;
        if (container) {
            container.scrollTo({
                left: index * container.clientWidth,
                behavior: reduceMotion ? 'instant' : 'smooth'
            });
            setActiveIndex(index);
        }
    }, [reduceMotion]);

    useWheelSections(containerRef, scrollToSection);

    const handleScroll = () => {
        const container = containerRef.current;
        if (container?.clientWidth) {
            setActiveIndex(Math.round(container.scrollLeft / container.clientWidth));
        }
    };

    const navItems = [
        { icon: Home, label: 'Home' },
        { icon: BookOpen, label: 'Journal' },
        { icon: Images, label: 'Memories' },
        { icon: Sparkles, label: 'Magic' },
    ];

    return (
        <div className="relative w-screen h-dvh bg-neutral-900 overflow-hidden font-sans" suppressHydrationWarning>
            <div className="absolute top-0 left-0 right-0 h-0.5 z-[60]" suppressHydrationWarning>
                <motion.div
                    style={{ scaleX, originX: 0 }}
                    className="h-full bg-[#b68094]/75"
                    suppressHydrationWarning
                />
            </div>

            <button type="button" onClick={() => scrollToSection(0)} className="heart-glass-brand absolute top-4 left-4 z-[60] sm:left-8" aria-label="HeartScript · Về Home">
                <Heart size={18} strokeWidth={1.6} aria-hidden="true" />
                HeartScript
            </button>

            {/* Horizontal Scroll Container */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                suppressHydrationWarning
            >
                {/* 1. Introduction & Counter */}
                <div id="section-0" className="snap-start shrink-0"><WelcomeSection /></div>

                {/* 2. Emotional: Diary */}
                <div id="section-1" className="snap-start shrink-0"><DiarySection /></div>

                {/* 3. Visual: Memories */}
                <div id="section-2" className="snap-start shrink-0"><MemoriesSection /></div>

                {/* 4. Building: Projects */}
                <div id="section-3" className="snap-start shrink-0"><ProjectsSection /></div>
            </div>

            {/* User Profile - Compact & Expandable */}
            <div className={cn("absolute top-4 z-[70]", activeIndex === 0 ? "right-[4.5rem] sm:right-[5.25rem]" : "right-4 sm:right-8")}>
                <div className="relative">
                    {/* Trigger (Avatar) */}
                    <motion.button
                        type="button"
                        aria-label="Hồ sơ"
                        aria-expanded={isProfileOpen}
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="heart-glass-button relative z-20 size-11 rounded-full p-[3px]"
                    >
                        <div className="relative size-full overflow-hidden rounded-full bg-[#e9d9d7]">
                            {user?.photoURL ? (
                                <Image
                                    src={user.photoURL}
                                    alt="User"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <Image
                                    src={COUPLE_AVATAR}
                                    alt="Couple"
                                    fill
                                    className="object-cover"
                                />
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[#fff9f3] bg-[#63846d]" />
                    </motion.button>

                    {/* Popover Content */}
                    <AnimatePresence>
                        {isProfileOpen && (
                            <>
                                {/* Click outside to close */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsProfileOpen(false)}
                                    className="fixed inset-0 z-10 bg-black/5 backdrop-blur-[2px]"
                                />

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.96, y: -6 }}
                                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96, y: -6 }}
                                    className={cn("heart-glass-surface heart-glass-profile-menu absolute top-12 z-20 w-72 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto p-6", activeIndex === 0 ? "-right-14" : "right-0")}
                                >
                                    <div className="space-y-6">
                                        {/* Avatar Edit Section */}
                                        <div className="flex flex-col items-center gap-4 py-2">
                                            <div className="relative group">
                                                <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white/5 relative">
                                                    <Image
                                                        src={user?.photoURL || COUPLE_AVATAR}
                                                        alt="Large User"
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                    {updating && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        </div>
                                                    )}
                                                </div>
                                                <label className="heart-glass-button absolute bottom-0 right-0 z-20 grid size-9 place-items-center rounded-full focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#ffcbe3]" data-glass-variant="dark">
                                                    <Camera className="size-4" aria-hidden="true" />
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="sr-only"
                                                        aria-label="Đổi ảnh đại diện"
                                                        onChange={handleUpdateAvatar}
                                                        disabled={updating}
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        {/* Display Name Section */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Display Name</span>
                                                {!isEditingName && (
                                                    <button
                                                        type="button"
                                                        aria-label="Đổi tên hiển thị"
                                                        onClick={() => setIsEditingName(true)}
                                                        className="heart-glass-button grid size-8 place-items-center rounded-lg"
                                                        data-glass-variant="dark"
                                                    >
                                                        <Pencil className="size-3.5" aria-hidden="true" />
                                                    </button>
                                                )}
                                            </div>

                                            {isEditingName ? (
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={newName}
                                                        onChange={(e) => setNewName(e.target.value)}
                                                        autoFocus
                                                        className="h-8 bg-white/5 border-white/10 text-xs rounded-lg focus:ring-rose-500"
                                                    />
                                                    <Button
                                                        disabled={updating}
                                                        onClick={handleUpdateName}
                                                        aria-label="Lưu tên hiển thị"
                                                        size="icon" className="size-8 shrink-0 rounded-lg"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => { setIsEditingName(false); setNewName(user?.displayName || ''); }}
                                                        aria-label="Hủy đổi tên"
                                                        data-glass-variant="dark"
                                                        variant="ghost" size="icon" className="size-8 shrink-0 rounded-lg"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <h3 className="text-xl font-serif italic text-white truncate">
                                                    {user?.displayName || 'Sweet Soul'}
                                                </h3>
                                            )}
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Account Path</span>
                                            <p className="text-xs text-white/50 truncate font-mono">{user?.email}</p>
                                        </div>

                                        <div className="h-px bg-white/5 w-full" />

                                        {/* Logout Button */}
                                        <Button
                                            onClick={async () => {
                                                if (confirm("Bạn muốn rời khỏi vũ trụ này? [Icon: LogOut]")) {
                                                    await signOut(auth);
                                                    await removeSession();
                                                }
                                            }}
                                            data-glass-variant="dark"
                                            className="w-full gap-2 rounded-2xl py-6 text-xs font-bold"
                                        >
                                            <LogOut className="size-4" aria-hidden="true" />
                                            Đăng xuất khỏi hệ thống
                                        </Button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <nav aria-label="Các phần của HeartScript" className="absolute bottom-[max(12px,env(safe-area-inset-bottom))] md:bottom-6 left-1/2 -translate-x-1/2 z-50">
                <motion.div
                    initial={reduceMotion ? false : { y: 14, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: reduceMotion ? 0 : .35 }}
                    className="heart-glass-surface heart-glass-crystal heart-glass-dock flex items-center gap-1 p-1.5 font-[family-name:var(--font-heart-ui)]"
                >
                    {navItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = activeIndex === index;
                        return (
                            <button
                                key={item.label}
                                type="button"
                                aria-current={isActive ? 'page' : undefined}
                                data-glass-variant="quiet"
                                onClick={() => scrollToSection(index)}
                                className="heart-glass-button heart-glass-nav-item relative flex min-h-[46px] min-w-[55px] flex-col items-center justify-center gap-0.5 rounded-full px-1.5 text-[10px] font-semibold sm:min-w-[72px]"
                            >
                                {isActive && <motion.span
                                    layoutId={reduceMotion ? undefined : 'dashboard-nav-active'}
                                    className="absolute inset-0 rounded-full border border-[#b7799266] bg-[#e8bbd04d] shadow-[inset_0_1px_1px_#fff9]"
                                />}
                                <Icon size={17} strokeWidth={isActive ? 2.25 : 1.8} className="relative" aria-hidden="true" />
                                <span className="relative">{item.label}</span>
                            </button>
                        );
                    })}
                </motion.div>
            </nav>
        </div>
    );
}
