'use client';

import { useState, useRef, useMemo } from 'react';
import { push, ref, set, remove, query, orderByChild, serverTimestamp } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { useCollection } from '@/hooks/useCollection';
import { Memory } from '@/types';
import Masonry from 'react-masonry-css';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ImagePlus, Loader2, X, Upload, Plus, Heart, PartyPopper, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { MemoryCard } from './components/MemoryCard';
import { HIM_EMAILS } from '@/lib/constants';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";

export function MemoriesSection() {
    const { user } = useAuthStore();
    const { data: memories, loading } = useCollection<Memory>('memories', (qRef) =>
        query(qRef, orderByChild('createdAt'))
    );
    // Reverse for newest first
    const displayedMemories = [...memories].reverse();
    const [uploading, setUploading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [deletionError, setDeletionError] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Pre-compute particle animations to avoid hydration mismatch
    const particleAnimations = useMemo(() => {
        return Array.from({ length: 6 }, (_, i) => {
            const seed1 = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
            const seed2 = Math.sin(i * 93.9898 + 12.233) * 43758.5453;
            const seed3 = Math.sin(i * 45.9898 + 34.233) * 43758.5453;
            const seed4 = Math.sin(i * 67.9898 + 56.233) * 43758.5453;
            const random1 = seed1 - Math.floor(seed1);
            const random2 = seed2 - Math.floor(seed2);
            const random3 = seed3 - Math.floor(seed3);
            const random4 = seed4 - Math.floor(seed4);

            return {
                initial: { opacity: 0, y: 100, x: random1 * 100 },
                animate: {
                    opacity: [0, 0.4, 0],
                    y: -100,
                    x: random2 * 100 - 50
                },
                transition: {
                    duration: 10 + random3 * 10,
                    repeat: Infinity,
                    delay: random4 * 5,
                    ease: "linear" as const
                },
                style: { left: `${random1 * 100}%` }
            };
        });
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const files = Array.from(e.target.files);
        const newPending = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        setPendingFiles(prev => [...prev, ...newPending]);
    };

    const removePending = (index: number) => {
        const removed = pendingFiles[index];
        URL.revokeObjectURL(removed.preview);
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUploadAll = async () => {
        if (!user || pendingFiles.length === 0) return;

        setUploading(true);
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "upload_social";

        try {
            for (const item of pendingFiles) {
                const formData = new FormData();
                formData.append('file', item.file);
                formData.append('upload_preset', uploadPreset);

                const response = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                    { method: 'POST', body: formData }
                );

                const data = await response.json();

                if (data.secure_url) {
                    const newMemoryRef = push(ref(rtdb, 'memories'));
                    await set(newMemoryRef, {
                        url: data.secure_url,
                        name: item.file.name || 'Memory',
                        type: 'image',
                        createdAt: serverTimestamp(),
                        userId: user.uid
                    });
                }
            }

            pendingFiles.forEach(item => URL.revokeObjectURL(item.preview));
            setPendingFiles([]);
            setIsAdding(false);
        } catch (err) {
            console.error("Upload failed:", err);
        } finally {
            setUploading(false);
        }
    };

    const canDelete = (memory: Memory) =>
        !!user && (user.uid === memory.userId || HIM_EMAILS.includes(user.email ?? ''));

    const handleDelete = async (e: React.MouseEvent, memory: Memory) => {
        e.stopPropagation();
        if (!canDelete(memory) || !window.confirm('Xóa ảnh này khỏi Sweet Moments?')) return;

        setDeletionError(false);
        try {
            await remove(ref(rtdb, `memories/${memory.id}`));
        } catch {
            setDeletionError(true);
        }
    };

    return (
        <section className="h-dvh w-screen flex flex-col relative overflow-hidden bg-[#fff0f5] snap-start shrink-0" suppressHydrationWarning>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&family=Patrick+Hand&family=Montserrat:wght@300;400;500&display=swap');
                
                .my-masonry-grid {
                    display: flex;
                    margin-left: -14px;
                    width: auto;
                }
                .my-masonry-grid_column {
                    padding-left: 14px;
                    min-width: 0;
                    background-clip: padding-box;
                }
                @media (min-width: 768px) {
                    .my-masonry-grid { margin-left: -24px; }
                    .my-masonry-grid_column { padding-left: 24px; }
                }
            `}</style>

            <div className="absolute inset-0 opacity-[0.4] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-rose-200/40 blur-[130px] rounded-full pointer-events-none mix-blend-multiply" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-200/40 blur-[130px] rounded-full pointer-events-none mix-blend-multiply" />

            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {particleAnimations.map((anim, i) => (
                    <motion.div
                        key={i}
                        initial={anim.initial}
                        animate={anim.animate}
                        transition={anim.transition}
                        className="absolute bottom-0 text-rose-300"
                        style={anim.style}
                    >
                        <Heart className={cn("w-4 h-4 fill-rose-200", i % 2 === 0 ? "w-6 h-6" : "w-4 h-4")} />
                    </motion.div>
                ))}
            </div>

            <div className="z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex flex-col h-full min-h-0 pt-[4.75rem] lg:pt-10">
                <div className="flex flex-wrap justify-between items-end gap-3 mb-4 sm:mb-8 shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-['Dancing_Script'] font-bold text-rose-500 drop-shadow-sm flex items-center gap-2 sm:gap-4">
                                Sweet Moments
                                <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                                    <Sparkles className="size-6 sm:size-8 text-yellow-400" />
                                </motion.div>
                            </h2>
                        </div>
                        <p className="text-stone-600 font-['Playfair_Display'] italic text-sm sm:text-xl mt-2 border-l-2 sm:border-l-4 border-rose-300 pl-3 py-1">
                            &quot;Mỗi bức ảnh là một nhịp đập của trái tim...&quot;
                        </p>
                    </div>

                    <Dialog open={isAdding} onOpenChange={setIsAdding}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-full px-4 sm:px-6 h-11 shadow-sm font-['Montserrat'] font-bold text-xs uppercase tracking-widest">
                                <ImagePlus className="w-4 h-4 mr-2" />
                                Add Memories
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[calc(100%-1.5rem)] bg-[#fffbf0] border-none text-stone-800 sm:max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90dvh] p-0 font-serif shadow-2xl">
                            <div className="absolute inset-0 opacity-[0.4] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none" />
                            <DialogHeader className="relative z-10 px-4 pt-5 pr-14 sm:px-8 sm:pr-14">
                                <DialogTitle className="text-xl sm:text-3xl font-['Playfair_Display'] font-bold flex items-center gap-2 text-rose-600 italic">
                                    <PartyPopper className="w-6 h-6" /> Create New Moments
                                </DialogTitle>
                                <DialogDescription className="text-stone-500 font-['Montserrat'] text-xs uppercase tracking-wider">
                                    Chọn những bức ảnh đẹp nhất để lưu giữ nhé
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 relative z-10">
                                {pendingFiles.length === 0 ? (
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full min-h-36 sm:min-h-52 p-3 border-2 border-dashed border-rose-200 rounded-3xl flex flex-col items-center justify-center space-y-3 cursor-pointer hover:bg-rose-50/50 transition-colors group">
                                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-300 group-hover:scale-110 transition-transform shadow-sm">
                                            <Upload className="w-8 h-8" />
                                        </div>
                                        <p className="text-stone-400 font-['Patrick_Hand'] text-xl">Chạm nhẹ để chọn ảnh nha...</p>
                                    </button>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {pendingFiles.map((item, i) => (
                                            <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden group shadow-md rotate-1 hover:rotate-0 transition-all duration-300 bg-white p-2">
                                                <div className="relative w-full h-full rounded-lg overflow-hidden">
                                                    <Image src={item.preview} alt="preview" fill className="object-cover" />
                                                </div>
                                                <button type="button" aria-label="Bỏ ảnh đã chọn" onClick={() => removePending(i)} className="absolute top-2 right-2 grid size-11 place-items-center bg-rose-600 rounded-full text-white shadow-lg hover:bg-rose-700 z-20">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        <button onClick={() => fileInputRef.current?.click()} className="aspect-[3/4] border-2 border-dashed border-rose-200 rounded-xl flex flex-col items-center justify-center text-rose-300 hover:text-rose-500 hover:bg-rose-50/50 transition-all">
                                            <Plus className="w-8 h-8" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />

                            <div className="p-3 sm:p-6 border-t border-stone-100 flex flex-wrap gap-2 justify-between items-center bg-white/50 relative z-10">
                                <p className="text-xs font-['Montserrat'] font-bold uppercase tracking-wider text-stone-400">{pendingFiles.length} photos selected</p>
                                <div className="flex gap-3">
                                    <Button variant="ghost" className="text-stone-500 hover:text-stone-800 font-['Montserrat'] text-xs font-bold uppercase" onClick={() => { setPendingFiles([]); setIsAdding(false); }}>Cancel</Button>
                                    <Button disabled={pendingFiles.length === 0 || uploading} onClick={handleUploadAll} className="bg-rose-600 hover:bg-rose-700 text-white px-3 sm:px-8 h-11 rounded-xl shadow-lg shadow-rose-200 font-['Montserrat'] text-xs font-bold uppercase tracking-wide">
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Verify & Upload"}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {deletionError && <p role="alert" className="mb-2 text-sm text-rose-800">Chưa xóa được ảnh. Bạn thử lại nhé.</p>}
                <div className="min-h-0 flex-1 overflow-hidden flex items-center">
                    {loading ? (
                        <div className="flex gap-6 overflow-hidden opacity-50 w-full justify-center">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-[280px] h-[380px] bg-white rounded-sm shadow-sm p-4 animate-pulse flex flex-col gap-4">
                                    <div className="w-full h-3/4 bg-stone-200 rounded-sm"></div>
                                    <div className="h-4 bg-stone-100 rounded w-1/2 mx-auto"></div>
                                </div>
                            ))}
                        </div>
                    ) : displayedMemories.length === 0 ? (
                        <div className="w-full text-center py-20 text-stone-400 font-['Patrick_Hand'] text-2xl flex flex-col items-center gap-4">
                            <ImagePlus className="w-16 h-16 opacity-20" />
                            <p>Chưa có kỷ niệm nào được lưu lại. Thêm ngay đi nè!</p>
                        </div>
                    ) : (
                        <div className="h-full w-full overflow-y-auto overflow-x-hidden px-1 pt-2 pb-28">
                            <Masonry
                                breakpointCols={{
                                    default: 5,
                                    1536: 4,
                                    1280: 3,
                                    1024: 2,
                                    359: 1
                                }}
                                className="my-masonry-grid"
                                columnClassName="my-masonry-grid_column"
                            >
                                {displayedMemories.map((memory, idx) => (
                                    <MemoryCard
                                        key={memory.id}
                                        memory={memory}
                                        idx={idx}
                                        canDelete={canDelete(memory)}
                                        onDelete={event => handleDelete(event, memory)}
                                    />
                                ))}
                            </Masonry>
                        </div>
                    )}
                </div>
            </div>

        </section>
    );
}
