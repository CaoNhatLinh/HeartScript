'use client';

import { useState, useRef } from 'react';
import { push, ref, set, remove, query, orderByChild, serverTimestamp } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { useCollection } from '@/hooks/useCollection';
import { Memory } from '@/types';
import { Button } from '@/components/ui/button';
import { ImagePlus, Loader2, X, Upload, Plus } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { MemoryCard } from './components/MemoryCard';
import styles from './keepsakes.module.css';
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
        <section className={cn(styles.page, styles.memories, 'snap-start shrink-0')}>
            <div className={styles.inner}>
                <div className={styles.scrollArea}>
                    {deletionError && <p role="alert" className="mb-2 text-sm text-rose-800">Chưa xóa được ảnh. Bạn thử lại nhé.</p>}
                    <div className={cn('heart-glass-surface', styles.albumPanel)}>
                        <header className={styles.header}>
                            <h2 className={styles.heading}>
                                Sweet Moments <Image src="/heart-glass/heart.webp" alt="" width={86} height={86} className={styles.headingArt} />
                            </h2>

                            <Dialog open={isAdding} onOpenChange={setIsAdding}>
                                <DialogTrigger asChild>
                                    <Button className={styles.primary}>
                                        <ImagePlus className="size-4" aria-hidden="true" />
                                        Thêm ảnh
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className={cn('heart-glass-surface w-[calc(100%-1.5rem)] sm:max-w-2xl overflow-hidden flex flex-col max-h-[90dvh] p-0', styles.dialog)}>
                                    <DialogHeader className="px-4 pt-5 pr-14 sm:px-8 sm:pr-14">
                                        <DialogTitle className={styles.dialogHeading}>Thêm kỷ niệm</DialogTitle>
                                        <DialogDescription>Chọn ảnh để lưu vào Sweet Moments.</DialogDescription>
                                    </DialogHeader>

                                    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8">
                                        {pendingFiles.length === 0 ? (
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className={cn('heart-glass-button', styles.filePicker)}>
                                                <Upload aria-hidden="true" />
                                                Chọn ảnh
                                            </button>
                                        ) : (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {pendingFiles.map((item, i) => (
                                                    <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white/70 p-2">
                                                        <div className="relative w-full h-full rounded-lg overflow-hidden">
                                                            <Image src={item.preview} alt={item.file.name} fill sizes="(max-width: 640px) 40vw, 180px" className="object-cover" />
                                                        </div>
                                                        <button type="button" aria-label="Bỏ ảnh đã chọn" onClick={() => removePending(i)} className={cn('heart-glass-button', styles.deletePhoto)}>
                                                            <X aria-hidden="true" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button type="button" aria-label="Chọn thêm ảnh" onClick={() => fileInputRef.current?.click()} className={cn('heart-glass-button', styles.filePicker, 'aspect-[3/4]')}>
                                                    <Plus aria-hidden="true" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />

                                    <div className={cn('p-3 sm:p-6 border-t flex flex-wrap gap-2 justify-between items-center', styles.dialogBand)}>
                                        <p className={styles.date}>{pendingFiles.length} ảnh đã chọn</p>
                                        <div className="flex gap-2">
                                            <Button variant="outline" className={styles.quietButton} onClick={() => { setPendingFiles([]); setIsAdding(false); }}>Hủy</Button>
                                            <Button disabled={pendingFiles.length === 0 || uploading} onClick={handleUploadAll} className={styles.primary}>
                                                {uploading ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Đang lưu</> : 'Lưu ảnh'}
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </header>
                        {loading ? (
                            <div className={styles.empty} role="status">
                                <Loader2 className="animate-spin" aria-hidden="true" />
                                <p>Đang mở album…</p>
                            </div>
                        ) : displayedMemories.length === 0 ? (
                            <div className={styles.empty}>
                                <ImagePlus aria-hidden="true" />
                                <p>Chưa có ảnh trong album.</p>
                            </div>
                        ) : (
                            <div className={styles.albumGrid}>
                                {displayedMemories.map((memory, idx) => (
                                    <MemoryCard
                                        key={memory.id}
                                        memory={memory}
                                        idx={idx}
                                        canDelete={canDelete(memory)}
                                        onDelete={event => handleDelete(event, memory)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
