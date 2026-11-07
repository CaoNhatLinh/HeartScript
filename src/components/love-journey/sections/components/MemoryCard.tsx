import { motion } from 'framer-motion';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Memory } from '@/types';

interface MemoryCardProps {
    memory: Memory;
    idx: number;
    canDelete: boolean;
    onDelete: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * MemoryCard - A small, Polaroid-style card for displaying memories
 */
export function MemoryCard({ memory, idx, canDelete, onDelete }: MemoryCardProps) {
    const rotateClass = idx % 2 === 0 ? 'md:rotate-1' : 'md:-rotate-1';

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx, 6) * 0.07, duration: 0.4 }}
            className={cn("mb-4 sm:mb-6 relative group", rotateClass)}
        >
            <div className="bg-white p-2 sm:p-2.5 pb-4 sm:pb-6 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.15)] rounded-sm relative border border-[#f0ebe0] overflow-hidden">
                {/* Tape Decor */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 bg-[#fdf6e3]/90 shadow-sm opacity-80 z-20 rotate-2 transform border-l border-r border-[#e6e2d1]/50 mix-blend-multiply" />

                <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 mb-3 rounded-sm filter brightness-[0.98] contrast-[0.95] group-hover:brightness-100 group-hover:contrast-100 transition-all duration-500">
                    <Image
                        src={memory.url}
                        alt="Memory"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 359px) 90vw, (max-width: 1024px) 45vw, 30vw"
                    />

                    {/* Delete Overlay */}
                    {canDelete && (
                        <button
                            type="button"
                            aria-label="Xóa ảnh kỷ niệm"
                            onClick={onDelete}
                            className="absolute top-1.5 right-1.5 z-20 grid size-11 place-items-center bg-white/95 hover:bg-red-600 hover:text-white rounded-full text-rose-800 transition-colors shadow-sm"
                        >
                            <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                    )}
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
