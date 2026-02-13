import { motion } from 'framer-motion';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Memory } from '@/types';

interface MemoryCardProps {
    memory: Memory;
    idx: number;
    userId?: string;
    onDelete: (e: React.MouseEvent, id: string) => void;
}

/**
 * MemoryCard - A small, Polaroid-style card for displaying memories
 */
export function MemoryCard({ memory, idx, userId, onDelete }: MemoryCardProps) {
    const rotateClass = idx % 2 === 0 ? 'rotate-1' : '-rotate-1';

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            className={cn("mb-8 relative group", rotateClass)}
            whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
        >
            <div className="bg-white p-2.5 pb-8 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.15)] rounded-sm relative cursor-pointer border border-[#f0ebe0] overflow-hidden hover:shadow-2xl transition-all duration-300">
                {/* Tape Decor */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 bg-[#fdf6e3]/90 shadow-sm opacity-80 z-20 rotate-2 transform border-l border-r border-[#e6e2d1]/50 mix-blend-multiply" />

                <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 mb-3 rounded-sm filter brightness-[0.98] contrast-[0.95] group-hover:brightness-100 group-hover:contrast-100 transition-all duration-500">
                    <Image
                        src={memory.url}
                        alt="Memory"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />

                    {/* Delete Overlay */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        {userId === memory.userId && (
                            <button
                                onClick={(e) => onDelete(e, memory.id)}
                                className="p-1.5 bg-white/80 backdrop-blur-sm hover:bg-red-500 hover:text-white rounded-full text-stone-500 transition-colors shadow-sm"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="text-center px-1">
                    <p className="text-[8px] text-stone-400 font-['Montserrat'] font-bold uppercase tracking-widest border-t border-dashed border-stone-100 pt-2 inline-block">
                        {memory.createdAt ? format(new Date(memory.createdAt as unknown as number), 'MMM dd, yyyy') : 'Timeless'}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
