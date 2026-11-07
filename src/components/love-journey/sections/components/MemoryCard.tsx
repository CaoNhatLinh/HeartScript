import Image from 'next/image';
import { CalendarDays, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Memory } from '@/types';
import styles from '../keepsakes.module.css';

interface MemoryCardProps {
    memory: Memory;
    idx: number;
    canDelete: boolean;
    onDelete: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function MemoryCard({ memory, idx, canDelete, onDelete }: MemoryCardProps) {
    const date = memory.createdAt ? new Date(memory.createdAt) : null;

    return (
        <article className={cn('heart-glass-surface', styles.albumCard)} style={{ animationDelay: `${Math.min(idx, 5) * 45}ms` }}>
            <div className={styles.photo}>
                <Image
                    src={memory.url}
                    alt="Ảnh kỷ niệm"
                    fill
                    sizes="(max-width: 460px) 85vw, (max-width: 760px) 45vw, (max-width: 1180px) 29vw, 340px"
                />
                {canDelete && (
                    <button
                        type="button"
                        aria-label="Xóa ảnh kỷ niệm"
                        onClick={onDelete}
                        className={styles.albumDelete}
                    >
                        <span className={cn('heart-glass-button', styles.albumDeleteFace)} aria-hidden="true">
                            <Trash2 size={13} />
                        </span>
                    </button>
                )}
            </div>

            <div className={cn(styles.photoDate, styles.date)}>
                {date && (
                    <>
                        <CalendarDays aria-hidden="true" />
                        <time dateTime={format(date, 'yyyy-MM-dd')}>{format(date, 'dd.MM.yyyy')}</time>
                    </>
                )}
            </div>
        </article>
    );
}
