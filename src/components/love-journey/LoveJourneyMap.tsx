'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
    Home,
    BookHeart,
    Image as ImageIcon,
    Calendar,
    Terminal,
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
import { CalendarSection } from './sections/CalendarSection';
import { ProjectsSection } from './sections/ProjectsSection';
import { useAuthStore } from '@/store/useAuthStore';
import { auth } from '@/lib/firebase';
import { signOut, updateProfile, User } from 'firebase/auth';
import { removeSession } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

const COUPLE_AVATAR = "/couple-art.png";

const SECTION_THEMES = [
    { from: 'from-neutral-900/0', to: 'to-mid-900/0' }, // Home
    { from: 'from-rose-200/20', to: 'to-orange-100/20' }, // Journal
    { from: 'from-purple-200/20', to: 'to-pink-100/20' }, // Memories
    { from: 'from-blue-200/20', to: 'to-cyan-100/20' }, // Plans
    { from: 'from-indigo-200/20', to: 'to-violet-100/20' }, // Projects
];

export default function LoveJourneyMap() {
    const { user, setUser } = useAuthStore();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user?.displayName || '');
    const [updating, setUpdating] = useState(false);

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

    const scrollToSection = (index: number) => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                left: index * window.innerWidth,
                behavior: 'smooth'
            });
            setActiveIndex(index);
        }
    };

    const handleScroll = () => {
        if (containerRef.current) {
            const index = Math.round(containerRef.current.scrollLeft / window.innerWidth);
            if (index !== activeIndex) {
                setActiveIndex(index);
            }
        }
    };

    const navItems = [
        { icon: Home, label: 'Home' },
        { icon: BookHeart, label: 'Journal' },
        { icon: ImageIcon, label: 'Memories' },
        { icon: Calendar, label: 'Plans' },
        { icon: Terminal, label: 'Magic' },
    ];

    return (
        <div className="relative w-screen h-screen bg-neutral-900 overflow-hidden font-sans" suppressHydrationWarning>
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-[60]" suppressHydrationWarning>
                <motion.div
                    style={{ scaleX, originX: 0 }}
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                    suppressHydrationWarning
                />
            </div>

            {/* Ambient Atmosphere Overlay */}
            <motion.div
                animate={{
                    background: `linear-gradient(to bottom, transparent, ${SECTION_THEMES[activeIndex]?.from.replace('from-', '') || 'transparent'})`
                }}
                transition={{ duration: 1 }}
                className="absolute inset-0 z-[55] pointer-events-none opacity-50 mix-blend-overlay"
            />

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

                {/* 4. Planning: Calendar */}
                <div id="section-3" className="snap-start shrink-0"><CalendarSection /></div>

                {/* 5. Building: Projects */}
                <div id="section-4" className="snap-start shrink-0"><ProjectsSection /></div>
            </div>

            {/* User Profile - Compact & Expandable */}
            <div className="absolute top-8 left-8 z-[70]">
                <div className="relative">
                    {/* Trigger (Avatar) */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className={cn(
                            "relative w-10 h-10 rounded-full p-1 bg-gradient-to-tr from-rose-500 via-purple-500 to-blue-500 shadow-xl transition-all z-20",
                            isProfileOpen ? "ring-4 ring-white/10" : ""
                        )}
                    >
                        <div className="w-full h-full rounded-full overflow-hidden bg-stone-900 border border-white/10 relative">
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
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1a1a1a] rounded-full shadow-lg" />
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
                                    initial={{ opacity: 0, scale: 0.9, x: -20, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, x: -20, y: -10 }}
                                    className="absolute top-12 left-0 w-72 bg-neutral-900/90 backdrop-blur-3xl border border-white/10 rounded-[32px] p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] z-20"
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
                                                <label className="absolute bottom-0 right-0 w-8 h-8 bg-rose-500 hover:bg-rose-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors border-2 border-neutral-900 z-20">
                                                    <Camera className="w-4 h-4 text-white" />
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
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
                                                        onClick={() => setIsEditingName(true)}
                                                        className="text-white/20 hover:text-rose-400 transition-colors"
                                                    >
                                                        <Pencil className="w-3 h-3" />
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
                                                        size="icon" className="h-8 w-8 bg-rose-500 hover:bg-rose-600 rounded-lg shrink-0"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => { setIsEditingName(false); setNewName(user?.displayName || ''); }}
                                                        variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0 hover:bg-white/5"
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
                                            className="w-full bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 py-6 rounded-2xl transition-all font-bold text-xs flex items-center justify-center gap-2 group"
                                        >
                                            <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            Đăng xuất khỏi hệ thống
                                        </Button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
                    className="flex items-center gap-3 px-3 py-3 bg-black/20 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:bg-black/30 transition-colors"
                >
                    {navItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = activeIndex === index;
                        return (
                            <div key={index} className="relative group">
                                <button
                                    onClick={() => scrollToSection(index)}
                                    className={cn(
                                        "relative p-3 rounded-full transition-all duration-500 ease-out z-10",
                                        isActive ? "text-white" : "text-white/40 hover:text-white"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute inset-0 bg-white/10 rounded-full scale-0 transition-transform duration-300 group-hover:scale-100",
                                        isActive && "scale-100 bg-white/20"
                                    )} />

                                    <Icon className={cn(
                                        "w-5 h-5 transition-transform duration-300",
                                        isActive ? "scale-110 stroke-[2.5px]" : "group-hover:scale-110"
                                    )} />
                                </button>

                                {/* Floating Label */}
                                <span className={cn(
                                    "absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-lg opacity-0 transform translate-y-2 transition-all duration-300 pointer-events-none border border-white/5",
                                    "group-hover:opacity-100 group-hover:translate-y-0"
                                )}>
                                    {item.label}
                                </span>

                                {/* Active Glow */}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-glow"
                                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/50 blur-md rounded-full"
                                    />
                                )}
                            </div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
}
