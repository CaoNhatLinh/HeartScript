'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { push, ref, set, remove, query, limitToLast, orderByChild, serverTimestamp } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { useCollection } from '@/hooks/useCollection';
import { JournalEntry } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HIM_EMAILS } from '@/lib/constants';
import {
    PenLine,
    Send,
    BookHeart,
    ChevronRight,
    Paperclip,
    X,
    Image as ImageIcon,
    Maximize2,
    Heart,
    Cloud,
    History,
    Loader2
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CldUploadWidget, CloudinaryUploadWidgetResults } from 'next-cloudinary';
import Image from 'next/image';

export function DiarySection() {
    const { user } = useAuthStore();
    const [limitCount, setLimitCount] = useState(5);
    const { data: entries, loading } = useCollection<JournalEntry>('journal', (qRef) =>
        query(qRef, orderByChild('createdAt'), limitToLast(limitCount))
    );
    // Reverse because limitToLast gets the latest but in ASC order
    const displayedEntries = [...entries].reverse();
    const [newEntry, setNewEntry] = useState('');
    const [tempMedia, setTempMedia] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
    const [isWriting, setIsWriting] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

    const handleSubmit = async () => {
        if (!newEntry.trim() || !user) return;
        const newRef = push(ref(rtdb, 'journal'));
        await set(newRef, {
            text: newEntry,
            media: tempMedia,
            createdAt: serverTimestamp(),
            authorEmail: user.email,
            authorId: user.uid
        });
        setNewEntry('');
        setTempMedia([]);
        setIsWriting(false);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("Xóa lá thư này mãi mãi?")) return;
        try {
            await remove(ref(rtdb, `journal/${id}`));
            if (selectedEntry?.id === id) setSelectedEntry(null);
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const handleUploadSuccess = (result: CloudinaryUploadWidgetResults) => {
        if (result.event === 'success' && result.info && typeof result.info !== 'string') {
            const info = result.info as { secure_url?: string; resource_type?: string };
            if (info.secure_url) {
                setTempMedia(prev => [...prev, {
                    url: info.secure_url!,
                    type: info.resource_type === 'video' ? 'video' : 'image'
                }]);
            }
        }
    };

    const removeMedia = (index: number) => {
        setTempMedia(prev => prev.filter((_, i) => i !== index));
    };

    const isHim = (email?: string) => email && HIM_EMAILS.includes(email);

    return (
        <section className="h-screen w-screen flex flex-col relative overflow-hidden bg-[#faf9f6] snap-start shrink-0">
            {/* Background Style */}
            <div className="absolute inset-0 opacity-[0.4] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

            <div className="flex-1 w-full max-w-3xl mx-auto p-6 md:p-12 flex flex-col relative z-10">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-4xl font-serif text-stone-800 flex items-center gap-3">
                            <BookHeart className="text-rose-500 w-8 h-8" />
                            Our Journal
                        </h2>
                        <p className="text-stone-500 italic mt-1 ml-11">Every thought, shared with love.</p>
                    </div>

                    <Dialog open={isWriting} onOpenChange={setIsWriting}>
                        <DialogTrigger asChild>
                            <Button className="rounded-full bg-stone-900 text-white hover:bg-black font-serif px-8 py-6 text-lg shadow-xl transition-all hover:scale-105 active:scale-95">
                                <PenLine className="w-5 h-5 mr-3" /> Write Letter
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl bg-[#fffcf5] border-none shadow-2xl p-0 overflow-hidden">
                            <div className="p-8 space-y-6">
                                <DialogHeader>
                                    <DialogTitle className="font-serif text-3xl text-center text-stone-800 italic">Dear My Love...</DialogTitle>
                                </DialogHeader>

                                <div className="relative group">
                                    <Textarea
                                        value={newEntry}
                                        onChange={(e) => setNewEntry(e.target.value)}
                                        placeholder="Let the words flow from your heart..."
                                        className="min-h-[300px] border-0 bg-transparent text-xl font-serif leading-relaxed focus-visible:ring-0 resize-none placeholder:text-stone-300 custom-scrollbar"
                                    />
                                    {/* Subtle lines like paper */}
                                    <div className="absolute inset-0 pointer-events-none border-b border-stone-100 mt-[1.5em]" style={{ background: 'repeating-linear-gradient(transparent, transparent 1.6em, #f0ede6 1.6em, #f0ede6 1.7em)', backgroundAttachment: 'local' }} />
                                </div>

                                {/* Media Previews */}
                                {tempMedia.length > 0 && (
                                    <div className="flex gap-3 overflow-x-auto py-2">
                                        {tempMedia.map((m, i) => (
                                            <div key={i} className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden shadow-md border-2 border-white">
                                                <Image src={m.url} alt="upload" fill className="object-cover" />
                                                <button
                                                    onClick={() => removeMedia(i)}
                                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                                    <CldUploadWidget
                                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
                                        onSuccess={handleUploadSuccess}
                                    >
                                        {({ open }) => (
                                            <Button variant="ghost" onClick={() => open()} className="text-stone-500 hover:text-stone-800">
                                                <Paperclip className="w-5 h-5 mr-2" /> Attach Media
                                            </Button>
                                        )}
                                    </CldUploadWidget>

                                    <Button onClick={handleSubmit} className="rounded-full bg-rose-500 hover:bg-rose-600 text-white px-8 py-6 shadow-lg shadow-rose-200 transition-all hover:-translate-y-1">
                                        <Send className="w-5 h-5 mr-3" /> Send Letter
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Journal List */}
                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-6 pb-24">
                    {loading ? (
                        <div className="text-center py-20 text-stone-400 italic text-xl">Opening the archive...</div>
                    ) : displayedEntries.length === 0 ? (
                        <div className="text-center py-20 text-stone-300 italic">No letters yet. Start our story.</div>
                    ) : (
                        <div className="grid gap-6">
                            {displayedEntries.map((entry) => {
                                const him = isHim(entry.authorEmail);
                                return (
                                    <div
                                        key={entry.id}
                                        onClick={() => setSelectedEntry(entry)}
                                        className={cn(
                                            "group relative bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 border-l-4",
                                            him ? "border-l-blue-400" : "border-l-rose-400"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                {/* Wax Seal Style Badge */}
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transform -rotate-12 transition-transform group-hover:rotate-0",
                                                    him ? "bg-gradient-to-br from-blue-500 to-indigo-600" : "bg-gradient-to-br from-rose-400 to-pink-500"
                                                )}>
                                                    {him ? <Cloud className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className={cn(
                                                        "text-[10px] font-bold uppercase tracking-widest",
                                                        him ? "text-blue-500" : "text-rose-500"
                                                    )}>
                                                        {him ? "Lời của Anh" : "Lời của Em"}
                                                    </p>
                                                    <p className="text-xs text-stone-400 font-sans">
                                                        {entry.createdAt ? format(new Date(entry.createdAt as unknown as number), 'MMM d, yyyy') : 'Recently'}
                                                    </p>
                                                </div>
                                            </div>
                                            {entry.media && entry.media.length > 0 && (
                                                <div className="bg-stone-50 p-2 rounded-lg text-stone-400 border border-stone-100 flex items-center gap-1">
                                                    <ImageIcon className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold">{entry.media.length}</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-serif text-xl text-stone-700 line-clamp-2 leading-relaxed pl-1">
                                            {entry.text}
                                        </p>
                                        <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-stone-400 text-sm italic flex items-center gap-1">Read letter <ChevronRight className="w-4 h-4" /></span>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Load More Button */}
                            <div className="pt-4 flex justify-center">
                                <Button
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLimitCount(prev => prev + 5);
                                    }}
                                    disabled={loading}
                                    className="text-stone-400 hover:text-stone-800 font-serif italic"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <History className="w-4 h-4 mr-2" />}
                                    Load older memories...
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Letter Detail View */}
            <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
                <DialogContent className="sm:max-w-3xl bg-[#fffefc] border-none shadow-3xl p-0 overflow-hidden max-h-[90vh] flex flex-col font-serif">
                    <div className={cn(
                        "absolute top-0 left-0 w-full h-2 bg-gradient-to-r",
                        isHim(selectedEntry?.authorEmail) ? "from-blue-200 via-indigo-200 to-cyan-200" : "from-rose-200 via-pink-200 to-rose-300"
                    )} />

                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                        <div className="space-y-10">
                            <div className="flex justify-between items-baseline border-b border-stone-100 pb-6">
                                <div>
                                    <p className={cn(
                                        "text-lg italic mb-1",
                                        isHim(selectedEntry?.authorEmail) ? "text-blue-600" : "text-rose-500"
                                    )}>
                                        From: {isHim(selectedEntry?.authorEmail) ? "My Soul (Anh)" : "My Love (Em)"}
                                    </p>
                                    <p className="text-stone-400 text-sm">
                                        {selectedEntry?.createdAt && format(new Date(selectedEntry.createdAt as unknown as number), 'EEEE, MMMM do yyyy')}
                                    </p>
                                </div>
                                {isHim(selectedEntry?.authorEmail) ? <Cloud className="text-blue-100 w-12 h-12" /> : <Heart className="text-rose-100 w-12 h-12" />}
                            </div>

                            <p className="text-2xl leading-loose text-stone-800 whitespace-pre-wrap font-cormorant first-letter:text-5xl first-letter:font-bold first-letter:text-stone-900 first-letter:mr-3 first-letter:float-left">
                                {selectedEntry?.text}
                            </p>

                            {/* Detailed Gallery */}
                            {selectedEntry?.media && selectedEntry.media.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                                    {selectedEntry.media.map((m, i) => (
                                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border-4 border-white group">
                                            <Image src={m.url} alt="Letter attachment" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Maximize2 className="text-white w-8 h-8" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8 bg-stone-50 border-t border-stone-100 flex justify-between items-center italic text-stone-400">
                        <div className="flex gap-4 items-center">
                            {user?.uid === selectedEntry?.authorId && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleDelete(e, selectedEntry!.id)}
                                    className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 font-sans text-[10px] uppercase font-bold tracking-widest"
                                >
                                    Delete Letter
                                </Button>
                            )}
                            <span>Forever yours.</span>
                        </div>
                        <Button variant="ghost" onClick={() => setSelectedEntry(null)} className="font-serif">Close Letter</Button>
                    </div>
                </DialogContent>
            </Dialog>

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
                    className="group flex items-center gap-6 text-stone-300 hover:text-rose-500 transition-all"
                >
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] [writing-mode:vertical-lr] rotate-180 transition-colors">
                        Discover Our Memories
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
        </section>
    );
}
