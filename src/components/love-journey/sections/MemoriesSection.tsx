'use client';

import { useState, useRef } from 'react';
import { push, ref, set, remove, query, orderByChild, serverTimestamp } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { useCollection } from '@/hooks/useCollection';
import { Memory } from '@/types';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ImagePlus, Loader2, Trash2, X, Upload, Plus, ChevronRight, Heart, PartyPopper, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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
    const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

            // Cleanup
            pendingFiles.forEach(item => URL.revokeObjectURL(item.preview));
            setPendingFiles([]);
            setIsAdding(false);
        } catch (err) {
            console.error("Upload failed:", err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("Xóa khoảnh khắc này mãi mãi? [Icon: AlertTriangle]")) return;

        try {
            await remove(ref(rtdb, `memories/${id}`));
        } catch (err) {
            console.error("Failed to delete memory:", err);
        }
    };

    return (
        <section className="h-screen w-screen flex flex-col relative overflow-hidden bg-[#fff0f5] snap-start shrink-0" suppressHydrationWarning>
            {/* Load Fonts */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&family=Patrick+Hand&family=Montserrat:wght@300;400;500&display=swap');
            `}</style>

            {/* Soft Background */}
            <div className="absolute inset-0 opacity-[0.4] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-rose-200/40 blur-[130px] rounded-full pointer-events-none mix-blend-multiply" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-200/40 blur-[130px] rounded-full pointer-events-none mix-blend-multiply" />

            {/* Floating Particles Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 100, x: Math.random() * 100 }}
                        animate={{
                            opacity: [0, 0.4, 0],
                            y: -100,
                            x: Math.random() * 100 - 50
                        }}
                        transition={{
                            duration: 10 + Math.random() * 10,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                            ease: "linear"
                        }}
                        className="absolute bottom-0 text-rose-300"
                        style={{ left: `${Math.random() * 100}%` }}
                    >
                        <Heart className={cn("w-4 h-4 fill-rose-200", i % 2 === 0 ? "w-6 h-6" : "w-4 h-4")} />
                    </motion.div>
                ))}
            </div>

            <div className="z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col h-full py-12">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-6xl md:text-7xl font-['Dancing_Script'] font-bold text-rose-500 drop-shadow-sm flex items-center gap-4">
                                Sweet Moments
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    <Sparkles className="w-8 h-8 text-yellow-400" />
                                </motion.div>
                            </h2>
                        </div>
                        <p className="text-stone-500 font-['Playfair_Display'] italic text-xl mt-2 border-l-4 border-rose-300 pl-4 py-1">
                            &quot;Mỗi bức ảnh là một nhịp đập của trái tim...&quot;
                        </p>
                    </div>

                    <Dialog open={isAdding} onOpenChange={setIsAdding}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="bg-white/80 backdrop-blur-sm border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-full px-6 py-6 shadow-sm transition-all hover:-translate-y-1 font-['Montserrat'] font-bold text-xs uppercase tracking-widest"
                            >
                                <ImagePlus className="w-4 h-4 mr-2" />
                                Add Memories
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#fffbf0] border-none text-stone-800 sm:max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] font-serif shadow-2xl">
                            <div className="absolute inset-0 opacity-[0.4] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none" />
                            <DialogHeader className="relative z-10 p-6 md:p-8 pb-2">
                                <DialogTitle className="text-3xl font-['Playfair_Display'] font-bold flex items-center gap-2 text-rose-500 italic">
                                    <PartyPopper className="w-6 h-6" /> Create New Moments
                                </DialogTitle>
                                <DialogDescription className="text-stone-500 font-['Montserrat'] text-xs uppercase tracking-wider">
                                    Chọn những bức ảnh đẹp nhất để lưu giữ nhé
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto p-8 pt-4 min-h-[300px] custom-scrollbar relative z-10">
                                {pendingFiles.length === 0 ? (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-full min-h-[300px] border-2 border-dashed border-rose-200 rounded-3xl flex flex-col items-center justify-center space-y-4 cursor-pointer hover:bg-rose-50/50 transition-colors group"
                                    >
                                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-300 group-hover:scale-110 transition-transform shadow-sm">
                                            <Upload className="w-8 h-8" />
                                        </div>
                                        <p className="text-stone-400 font-['Patrick_Hand'] text-xl">Chạm nhẹ để chọn ảnh nha...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {pendingFiles.map((item, i) => (
                                            <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden group shadow-md rotate-1 hover:rotate-0 transition-all duration-300 bg-white p-2">
                                                <div className="relative w-full h-full rounded-lg overflow-hidden">
                                                    <Image src={item.preview} alt="preview" fill className="object-cover" />
                                                </div>
                                                <button
                                                    onClick={() => removePending(i)}
                                                    className="absolute -top-2 -right-2 p-1.5 bg-rose-500 rounded-full text-white shadow-lg hover:bg-rose-600 transition-all opacity-0 group-hover:opacity-100 scale-90 hover:scale-110 z-20"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="aspect-[3/4] border-2 border-dashed border-rose-200 rounded-xl flex flex-col items-center justify-center text-rose-300 hover:text-rose-500 hover:bg-rose-50/50 transition-all"
                                        >
                                            <Plus className="w-8 h-8" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                            />

                            <div className="p-6 border-t border-stone-100 flex justify-between items-center bg-white/50 relative z-10">
                                <p className="text-xs font-['Montserrat'] font-bold uppercase tracking-wider text-stone-400">{pendingFiles.length} photos selected</p>
                                <div className="flex gap-3">
                                    <Button variant="ghost" className="text-stone-500 hover:text-stone-800 font-['Montserrat'] text-xs font-bold uppercase" onClick={() => { setPendingFiles([]); setIsAdding(false); }}>Cancel</Button>
                                    <Button
                                        disabled={pendingFiles.length === 0 || uploading}
                                        onClick={handleUploadAll}
                                        className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-2 rounded-xl shadow-lg shadow-rose-200 transition-all font-['Montserrat'] text-xs font-bold uppercase tracking-widest"
                                    >
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Verify & Upload"}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex-1 overflow-hidden flex items-center">
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
                        <Carousel className="w-full max-w-[95%] mx-auto" opts={{ align: "start", loop: true }}>
                            <CarouselContent className="-ml-6 py-10">
                                {displayedMemories.map((memory, idx) => {
                                    // Randomize slight rotation for a natural "messy" look
                                    const rotateClass = idx % 2 === 0 ? 'rotate-2' : '-rotate-2';
                                    const yOffset = idx % 3 === 0 ? 'mt-8' : 'mt-0'; // Staggered height

                                    return (
                                        <CarouselItem key={memory.id} className="pl-8 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 pt-8 pb-12">
                                            <motion.div
                                                className={cn("h-full select-none transform transition-all duration-500 ease-out", rotateClass, yOffset)}
                                                whileHover={{ y: -20, rotate: 0, scale: 1.05, zIndex: 10 }}
                                            >
                                                <div className="bg-white p-4 pb-12 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)] rounded-sm relative group cursor-pointer border border-[#f0ebe0] overflow-hidden">
                                                    {/* Tape */}
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-[#fdf6e3]/90 shadow-sm opacity-90 z-20 -rotate-1 transform border-l border-r border-[#e6e2d1]/50 mix-blend-multiply" />

                                                    {/* Glossy Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity duration-700" />

                                                    <div className="aspect-[3/4] relative overflow-hidden bg-stone-100 mb-6 filter sepia-[0.2] contrast-[0.95] group-hover:sepia-0 group-hover:contrast-100 transition-all duration-700 rounded-sm border border-stone-100">
                                                        <Image
                                                            src={memory.url}
                                                            alt="Memory"
                                                            fill
                                                            className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                                                            {user?.uid === memory.userId && (
                                                                <button
                                                                    onClick={(e) => handleDelete(e, memory.id)}
                                                                    className="p-3 bg-white/20 backdrop-blur-md hover:bg-red-500 hover:text-white rounded-full text-white transition-all transform scale-0 group-hover:scale-100 duration-300 border border-white/50"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="text-center px-1 relative">
                                                        <p className="font-['Patrick_Hand'] text-2xl text-stone-600 truncate group-hover:text-rose-500 transition-colors leading-6">
                                                            {memory.name || "Our Memory"}
                                                        </p>
                                                        <p className="text-[10px] text-stone-400 font-['Montserrat'] font-bold uppercase tracking-widest mt-2 border-t border-dashed border-stone-200 pt-2 inline-block px-4">
                                                            {memory.createdAt ? format(new Date(memory.createdAt as unknown as number), 'MMMM dd, yyyy') : 'Timeless'}
                                                        </p>

                                                        {/* Cute decorative doodle or heart */}
                                                        <div className="absolute -bottom-8 -right-4 opacity-0 group-hover:opacity-60 transition-opacity duration-500 rotate-12">
                                                            <Heart className="w-8 h-8 text-rose-300 fill-rose-100" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </CarouselItem>
                                    );
                                })}
                            </CarouselContent>
                            <CarouselPrevious className="left-[-20px] bg-white/80 hover:bg-white text-stone-600 border-none shadow-lg h-12 w-12" />
                            <CarouselNext className="right-[-20px] bg-white/80 hover:bg-white text-stone-600 border-none shadow-lg h-12 w-12" />
                        </Carousel>
                    )}
                </div>
            </div>

            {/* Right Side Exploration Hint */}
            <div className="absolute top-1/2 right-4 -translate-y-1/2 z-20">
                <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5 }}
                    onClick={(e: React.MouseEvent) => {
                        const container = e.currentTarget.closest('.snap-x');
                        if (container) {
                            container.scrollBy({ left: window.innerWidth, behavior: 'smooth' });
                        }
                    }}
                    className="group flex items-center gap-6 text-stone-400 hover:text-rose-500 transition-all"
                >
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] [writing-mode:vertical-lr] rotate-180 transition-colors">
                        See Our Future Plans
                    </span>

                    <div className="flex flex-col items-center gap-4">
                        <div className="w-px h-20 bg-gradient-to-b from-transparent via-stone-300 to-stone-300 group-hover:via-rose-300 transition-all" />
                        <motion.div
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            animate={{ x: [0, 5, 0] }}
                            transition={{ x: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
                            className="p-5 bg-white/40 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.05)] group-hover:shadow-rose-100 group-hover:border-rose-100 transition-all"
                        >
                            <ChevronRight className="w-6 h-6 text-stone-400 group-hover:text-rose-500" />
                        </motion.div>
                        <div className="w-px h-20 bg-gradient-to-t from-transparent via-stone-300 to-stone-300 group-hover:via-rose-300 transition-all" />
                    </div>
                </motion.button>
            </div>
        </section>
    );
}
