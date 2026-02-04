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
import { ImagePlus, Loader2, Trash2, X, Upload, Plus, ChevronRight } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
        <section className="h-screen w-screen flex flex-col justify-center bg-black snap-start shrink-0 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black z-0" />

            <div className="z-10 w-full max-w-6xl mx-auto px-8 space-y-8">
                <div className="flex justify-between items-end text-white">
                    <div>
                        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                            Moments
                        </h2>
                        <p className="text-zinc-500 mt-2">Frozen in time forever.</p>
                    </div>

                    <Dialog open={isAdding} onOpenChange={setIsAdding}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 rounded-xl"
                            >
                                <ImagePlus className="w-4 h-4 mr-2" />
                                Add Memories
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                    <Plus className="text-pink-500" /> Choose New Moments
                                </DialogTitle>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto p-2 min-h-[300px] custom-scrollbar">
                                {pendingFiles.length === 0 ? (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-full border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center space-y-4 cursor-pointer hover:bg-white/5 transition-colors"
                                    >
                                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500">
                                            <Upload className="w-8 h-8" />
                                        </div>
                                        <p className="text-zinc-500 font-medium">Click to select photos</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-4">
                                        {pendingFiles.map((item, i) => (
                                            <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden group border border-zinc-800">
                                                <Image src={item.preview} alt="preview" fill className="object-cover" />
                                                <button
                                                    onClick={() => removePending(i)}
                                                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="aspect-[3/4] border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-600 hover:text-zinc-400 hover:bg-white/5 transition-all"
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

                            <div className="p-6 border-t border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                                <p className="text-sm text-zinc-500">{pendingFiles.length} photos selected</p>
                                <div className="flex gap-3">
                                    <Button variant="ghost" onClick={() => { setPendingFiles([]); setIsAdding(false); }}>Cancel</Button>
                                    <Button
                                        disabled={pendingFiles.length === 0 || uploading}
                                        onClick={handleUploadAll}
                                        className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-8 py-2 font-bold rounded-xl shadow-lg shadow-pink-500/20"
                                    >
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Done & Upload"}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {loading ? (
                    <div className="flex gap-4 overflow-hidden opacity-50">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-[300px] h-[400px] bg-zinc-800 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : displayedMemories.length === 0 ? (
                    <div className="text-center py-20 text-zinc-600">No memories yet. Start capturing.</div>
                ) : (
                    <Carousel className="w-full">
                        <CarouselContent className="-ml-4">
                            {displayedMemories.map((memory) => (
                                <CarouselItem key={memory.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                    <div className="p-1">
                                        <Card className="border-0 bg-transparent overflow-hidden">
                                            <CardContent className="flex aspect-[3/4] items-center justify-center p-0 relative group">
                                                <Image
                                                    src={memory.url}
                                                    alt="Memory"
                                                    fill
                                                    className="object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex flex-col justify-end p-6">
                                                    {user?.uid === memory.userId && (
                                                        <button
                                                            onClick={(e) => handleDelete(e, memory.id)}
                                                            className="absolute top-4 right-4 p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {memory.name && <p className="text-white font-medium truncate">{memory.name}</p>}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-4 bg-white/10 border-none text-white hover:bg-white/20" />
                        <CarouselNext className="right-4 bg-white/10 border-none text-white hover:bg-white/20" />
                    </Carousel>
                )}
            </div>

            {/* Right Side Exploration Hint */}
            <div className="absolute top-1/2 right-8 -translate-y-1/2 z-20">
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
                    className="group flex items-center gap-6 text-zinc-600 hover:text-pink-500 transition-all"
                >
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] [writing-mode:vertical-lr] rotate-180 transition-colors">
                        See Our Future Plans
                    </span>

                    <div className="flex flex-col items-center gap-4">
                        <div className="w-px h-20 bg-gradient-to-b from-transparent via-zinc-800 to-zinc-800 group-hover:via-pink-900 transition-all" />
                        <motion.div
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            animate={{ x: [0, 5, 0] }}
                            transition={{ x: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
                            className="p-5 bg-zinc-900/40 backdrop-blur-2xl rounded-3xl border border-zinc-800 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] group-hover:shadow-pink-900/20 group-hover:border-pink-500/50 transition-all"
                        >
                            <ChevronRight className="w-6 h-6 text-zinc-500 group-hover:text-pink-500" />
                        </motion.div>
                        <div className="w-px h-20 bg-gradient-to-t from-transparent via-zinc-800 to-zinc-800 group-hover:via-pink-900 transition-all" />
                    </div>
                </motion.button>
            </div>
        </section>
    );
}
