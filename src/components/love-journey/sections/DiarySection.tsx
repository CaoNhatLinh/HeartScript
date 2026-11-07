'use client';

import { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';
import { push, ref, set, update, query, limitToLast, orderByChild, serverTimestamp, onValue, DatabaseReference } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { useCollection } from '@/hooks/useCollection';
import { JournalEntry, DeletedJournalLog } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HIM_EMAILS } from '@/lib/constants';
import {
    PenLine,
    Send,
    BookHeart,
    Mail,
    ChevronRight,
    Paperclip,
    X,
    Image as ImageIcon,
    Heart,
    Cloud,
    History,
    Loader2,
    AlertTriangle,
    Trash2,
    Settings,
    Upload
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Image from 'next/image';
import { detectMood, MOODS, MoodType } from '@/lib/love-config';
import { Sun, CloudRain, Heart as HeartIcon, Cloud as CloudIcon } from 'lucide-react';
import styles from './keepsakes.module.css';

const LetterSkeleton = () => (
    <div className="relative bg-[#fffbf0]/50 rounded-sm p-6 shadow-sm border border-[#f0ebe0] overflow-hidden animate-pulse">
        <div className="relative z-10 flex flex-col h-full gap-4">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-200" />
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-stone-200 rounded" />
                        <div className="h-3 w-16 bg-stone-100 rounded" />
                    </div>
                </div>
                <div className="w-8 h-8 bg-stone-100 rounded" />
            </div>
            <div className="space-y-3 py-4">
                <div className="h-4 w-full bg-stone-200 rounded" />
                <div className="h-4 w-[90%] bg-stone-200 rounded" />
                <div className="h-4 w-2/3 bg-stone-200 rounded" />
            </div>
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-dashed border-stone-200">
                <div className="h-4 w-16 bg-stone-100 rounded" />
                <div className="h-4 w-20 bg-stone-100 rounded" />
            </div>
        </div>
    </div>
);

const MoodAtmosphere = memo(({ mood }: { mood: MoodType }) => {
    const reduceMotion = useReducedMotion();

    // Love Particles (Memoized - stable random values via useMemo)
    const loveParticles = useMemo(() => [...Array(15)].map((_, i) => ({
        id: i,
        left: Math.random() * 90 + 5, // eslint-disable-line
        duration: 15 + Math.random() * 10, // eslint-disable-line
        swayDuration: 3 + Math.random() * 4, // eslint-disable-line
        delay: -(Math.random() * 20), // eslint-disable-line
        size: Math.random() * 20 + 15, // eslint-disable-line
        blur: Math.random() > 0.6 ? 'blur-[1px]' : 'blur-none', // eslint-disable-line
        opacity: 0.3 + Math.random() * 0.3 // eslint-disable-line
    })), []);

    // Sad Particles (Memoized - stable random values via useMemo)
    const sadParticles = useMemo(() => [...Array(40)].map((_, i) => ({
        id: i,
        left: Math.random() * 100, // eslint-disable-line
        duration: 0.8 + Math.random() * 0.5, // eslint-disable-line
        delay: -(Math.random() * 2), // eslint-disable-line
        length: 60 + Math.random() * 40, // eslint-disable-line
        opacity: 0.2 + Math.random() * 0.3 // eslint-disable-line
    })), []);

    // Happy Particles (Memoized - stable random values via useMemo)
    const happyParticles = useMemo(() => [...Array(8)].map((_, i) => ({
        id: i,
        left: Math.random() * 90 + 5, // eslint-disable-line
        top: Math.random() * 80 + 10, // eslint-disable-line
        duration: 4 + Math.random() * 4, // eslint-disable-line
        delay: -(Math.random() * 5), // eslint-disable-line
        scale: 0.8 + Math.random() * 0.5, // eslint-disable-line
        opacity: 0.4 + Math.random() * 0.4 // eslint-disable-line
    })), []);

    // Calm Particles (Memoized - stable random values via useMemo)
    const calmParticles = useMemo(() => [...Array(5)].map((_, i) => ({
        id: i,
        top: 10 + Math.random() * 60, // eslint-disable-line
        duration: 40 + Math.random() * 20, // eslint-disable-line
        delay: -(Math.random() * 40), // eslint-disable-line
        scale: 0.8 + Math.random() * 0.4, // eslint-disable-line
        blur: Math.random() > 0.5 ? 'blur-sm' : 'blur-none', // eslint-disable-line
        opacity: 0.3 + Math.random() * 0.2 // eslint-disable-line
    })), []);

    if (reduceMotion) return null;

    if (mood === 'love') {
        return (
            <>
                <style jsx>{`
                    @keyframes rise {
                        0% { transform: translateY(110vh) scale(0.8); opacity: 0; }
                        10% { opacity: var(--target-opacity); }
                        90% { opacity: var(--target-opacity); }
                        100% { transform: translateY(-20vh) scale(1.2); opacity: 0; }
                    }
                    @keyframes sway {
                        0% { transform: translateX(-15px) rotate(-10deg); }
                        100% { transform: translateX(15px) rotate(10deg); }
                    }
                    .heart-rise {
                        animation: rise linear infinite;
                    }
                    .heart-sway {
                        animation: sway ease-in-out infinite alternate;
                    }
                `}</style>
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5] w-full h-full">
                    {loveParticles.map((p) => (
                        <div
                            key={`love-${p.id}`}
                            className="heart-rise absolute"
                            style={{
                                left: `${p.left}%`,
                                width: p.size,
                                height: p.size,
                                // Pass dynamic values to CSS vars
                                ['--target-opacity' as string]: p.opacity,
                                animationDuration: `${p.duration}s`,
                                animationDelay: `${p.delay}s`
                            }}
                        >
                            <div
                                className={`heart-sway w-full h-full text-rose-400 ${p.blur}`}
                                style={{ animationDuration: `${p.swayDuration}s` }}
                            >
                                <Heart className="w-full h-full fill-rose-300/50 stroke-rose-400" strokeWidth={1.5} />
                            </div>
                        </div>
                    ))}
                    {/* Soft Ambient Glow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-rose-50/30 via-transparent to-transparent pointer-events-none" />
                </div>
            </>
        );
    }

    if (mood === 'sad') {
        return (
            <>
                <style jsx>{`
                    @keyframes rainfall {
                        0% { transform: translateY(-10vh); opacity: 0; }
                        10% { opacity: var(--target-opacity); }
                        90% { opacity: var(--target-opacity); }
                        100% { transform: translateY(110vh); opacity: 0; }
                    }
                    .rain-drop { animation: rainfall linear infinite; }
                `}</style>
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5] w-full h-full">
                    {sadParticles.map((p) => (
                        <div
                            key={`sad-${p.id}`}
                            className="rain-drop absolute w-[1.5px] bg-gradient-to-b from-transparent via-blue-400 to-transparent"
                            style={{
                                left: `${p.left}%`,
                                height: p.length,
                                ['--target-opacity' as string]: p.opacity,
                                animationDuration: `${p.duration}s`,
                                animationDelay: `${p.delay}s`
                            }}
                        />
                    ))}
                </div>
            </>
        );
    }

    if (mood === 'happy') {
        return (
            <>
                <style jsx>{`
                    @keyframes sun-spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes float-bob {
                        0%, 100% { transform: translateY(0) scale(1); }
                        50% { transform: translateY(-15px) scale(1.1); }
                    }
                    .sun-rotate { animation: sun-spin linear infinite; }
                    .happy-float { animation: float-bob ease-in-out infinite; }
                `}</style>
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5] w-full h-full">
                    {/* Rotating Sun Rays Background */}
                    <div
                        className="sun-rotate absolute -top-[50%] -right-[50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(251,191,36,0.1)_20deg,transparent_40deg)]"
                        style={{ animationDuration: '60s' }}
                    />

                    {/* Floating Sun Motes */}
                    {happyParticles.map((p) => (
                        <div
                            key={`happy-${p.id}`}
                            className="happy-float absolute text-amber-400"
                            style={{
                                left: `${p.left}%`,
                                top: `${p.top}%`,
                                transform: `scale(${p.scale})`,
                                opacity: p.opacity,
                                animationDuration: `${p.duration}s`,
                                animationDelay: `${p.delay}s`
                            }}
                        >
                            <Sun className="w-6 h-6 fill-amber-300 stroke-amber-400" />
                        </div>
                    ))}
                    <div className="absolute inset-0 bg-amber-50/20 pointer-events-none" />
                </div>
            </>
        );
    }

    if (mood === 'calm') {
        return (
            <>
                <style jsx>{`
                    @keyframes cloud-drift {
                        from { transform: translateX(-150px); }
                        to { transform: translateX(100vw); }
                    }
                    .drifting-cloud { animation: cloud-drift linear infinite; }
                `}</style>
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5] w-full h-full bg-teal-50/20">
                    {calmParticles.map((p) => (
                        <div
                            key={`calm-${p.id}`}
                            className="drifting-cloud absolute text-teal-200/60"
                            style={{
                                top: `${p.top}%`,
                                opacity: p.opacity,
                                animationDuration: `${p.duration}s`,
                                animationDelay: `${p.delay}s`
                            }}
                        >
                            <div className={`transform ${p.blur}`} style={{ transform: `scale(${p.scale})` }}>
                                <Cloud className="w-24 h-24 fill-teal-100/50 stroke-teal-200" />
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    }

    return null; // Fallback
});
MoodAtmosphere.displayName = 'MoodAtmosphere';

export function DiarySection() {
    const { user } = useAuthStore();
    const [limitCount, setLimitCount] = useState(20);
    const [hasMore, setHasMore] = useState(true);
    const observerRef = useRef<HTMLDivElement>(null);

    const queryFn = useCallback((qRef: DatabaseReference) =>
        query(qRef, orderByChild('createdAt'), limitToLast(limitCount))
        , [limitCount]);

    const { data: entries, loading } = useCollection<JournalEntry>('journal', queryFn);

    // Track if we really have more data
    useEffect(() => {
        if (!loading) {
            if (entries.length < limitCount) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }
        }
    }, [entries, limitCount, loading]);

    // Infinite Scroll Implementation
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    setLimitCount(prev => prev + 10);
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loading]);
    // Filter out deleted entries (both isDeleted flag and deletedAt timestamp) and reverse for latest first
    const displayedEntries = [...entries]
        .filter(entry => !entry.isDeleted && !entry.deletedAt)
        .reverse();
    const [newEntry, setNewEntry] = useState('');
    const [tempMedia, setTempMedia] = useState<{ url: string; type: 'image' | 'video'; file?: File }[]>([]);
    const [isWriting, setIsWriting] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
    const [showDeletedLogs, setShowDeletedLogs] = useState(false);
    const [displayNames, setDisplayNames] = useState({ him: 'Anh', her: 'Em' });
    const [avatars, setAvatars] = useState({ him: '', her: '' });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [tempNames, setTempNames] = useState({ him: 'Anh', her: 'Em' });
    const [tempAvatars, setTempAvatars] = useState({ him: '', her: '' });
    const [isUploadingAvatar, setIsUploadingAvatar] = useState<'him' | 'her' | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [currentMood, setCurrentMood] = useState<MoodType>('default');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Load Display Names and Avatars
    useEffect(() => {
        const configRef = ref(rtdb, 'couple_config');
        const unsubscribe = onValue(configRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                if (data.display_names) {
                    setDisplayNames({
                        him: data.display_names.him || 'Anh',
                        her: data.display_names.her || 'Em'
                    });
                    setTempNames({
                        him: data.display_names.him || 'Anh',
                        her: data.display_names.her || 'Em'
                    });
                }
                if (data.avatars) {
                    setAvatars({
                        him: data.avatars.him || '',
                        her: data.avatars.her || ''
                    });
                    setTempAvatars({
                        him: data.avatars.him || '',
                        her: data.avatars.her || ''
                    });
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const saveSettings = async () => {
        await update(ref(rtdb, 'couple_config'), {
            display_names: tempNames,
            avatars: tempAvatars
        });
        setIsSettingsOpen(false);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !isUploadingAvatar) return;
        const file = e.target.files[0];

        try {
            const url = await uploadToCloudinary(file);
            setTempAvatars(prev => ({
                ...prev,
                [isUploadingAvatar]: url
            }));
        } catch (error) {
            console.error("Failed to upload avatar:", error);
            alert("Failed to upload avatar. Please try again.");
        } finally {
            setIsUploadingAvatar(null);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };



    // Fetch deleted logs
    const { data: deletedLogs } = useCollection<DeletedJournalLog>('journal_deleted_logs', (qRef) =>
        query(qRef, limitToLast(50))
    );
    const displayedDeletedLogs = [...deletedLogs].reverse();

    const handleSubmit = async () => {
        if (!newEntry.trim() || !user) return;

        try {
            // Upload files to Cloudinary if any
            const uploadedMedia = await Promise.all(
                tempMedia.map(async (media) => {
                    if (media.file) {
                        const uploadedUrl = await uploadToCloudinary(media.file);
                        return {
                            url: uploadedUrl,
                            type: media.type
                        };
                    }
                    return {
                        url: media.url,
                        type: media.type
                    };
                })
            );

            if (editingId) {
                // Update existing entry
                // Recalculate mood on update
                const finalMood = currentMood !== 'default' ? currentMood : detectMood(newEntry);

                await update(ref(rtdb, `journal/${editingId}`), {
                    text: newEntry,
                    media: uploadedMedia,
                    updatedAt: serverTimestamp(),
                    updatedBy: user.uid,
                    mood: finalMood
                });
                setEditingId(null);
            } else {
                // Create new entry
                const newRef = push(ref(rtdb, 'journal'));
                // Ensure valid mood before saving
                const finalMood = currentMood !== 'default' ? currentMood : detectMood(newEntry);

                await set(newRef, {
                    text: newEntry,
                    media: uploadedMedia,
                    createdAt: serverTimestamp(),
                    authorEmail: user.email,
                    authorId: user.uid,
                    mood: finalMood
                });
            }

            setNewEntry('');
            setTempMedia([]);
            setIsWriting(false);
            setCurrentMood('default');
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to send letter. Please try again.');
        }
    };

    const handleEdit = (entry: JournalEntry) => {
        setNewEntry(entry.text);
        setTempMedia(entry.media || []);
        setCurrentMood(entry.mood || 'default');
        setEditingId(entry.id);
        setSelectedEntry(null); // Close view dialog
        setIsWriting(true); // Open write dialog
    };

    const handleCloseWrite = () => {
        setIsWriting(false);
        setNewEntry('');
        setTempMedia([]);
        setEditingId(null);
        setCurrentMood('default');
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteConfirmation(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation) return;
        const id = deleteConfirmation;

        try {
            const entryToDelete = displayedEntries.find(entry => entry.id === id);
            if (!entryToDelete) return;

            const logRef = push(ref(rtdb, 'journal_deleted_logs'));
            const deletedLog: Omit<DeletedJournalLog, 'id'> = {
                originalEntryId: entryToDelete.id || 'unknown',
                text: entryToDelete.text || '',
                media: entryToDelete.media || [], // Ensure media is at least an empty array or null
                createdAt: entryToDelete.createdAt || Date.now(),
                authorEmail: entryToDelete.authorEmail || 'unknown',
                authorId: entryToDelete.authorId || 'unknown',
                mood: entryToDelete.mood || 'default',
                deletedAt: serverTimestamp(),
                deletedBy: user?.uid || 'unknown'
            };
            await set(logRef, deletedLog);

            await update(ref(rtdb, `journal/${id}`), {
                isDeleted: true,
                deletedAt: serverTimestamp(),
                deletedBy: user?.uid
            });

            if (selectedEntry?.id === id) setSelectedEntry(null);
            setDeleteConfirmation(null);
        } catch (error) {
            console.error("Delete failed:", error);
            // Optional: Add toast error here
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
        const newMediaItems: { url: string; type: 'image' | 'video'; file: File }[] = [];

        Array.from(files).forEach(file => {
            if (file.size > maxSize) {
                alert(`File ${file.name} is too large. Maximum size is 10MB.`);
                return;
            }

            if (!allowedTypes.includes(file.type)) {
                alert(`File ${file.name} has unsupported format. Please use JPG, PNG, GIF, WebP, MP4, or MOV.`);
                return;
            }

            const previewUrl = URL.createObjectURL(file);
            const isVideo = file.type.startsWith('video/');

            newMediaItems.push({
                url: previewUrl,
                type: isVideo ? 'video' : 'image',
                file: file
            });
        });

        if (newMediaItems.length > 0) {
            setTempMedia(prev => [...prev, ...newMediaItems]);
        }

        // Reset input
        event.target.value = '';
    };

    const uploadToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        return data.secure_url;
    };

    const removeMedia = (index: number) => {
        setTempMedia(prev => {
            const newMedia = [...prev];
            const removed = newMedia.splice(index, 1)[0];
            // Revoke object URL to free memory
            if (removed.url.startsWith('blob:')) {
                URL.revokeObjectURL(removed.url);
            }
            return newMedia;
        });
    };

    const isHim = (email?: string | null) => email && HIM_EMAILS.includes(email);

    return (
        <section className={cn(styles.page, styles.journal, 'snap-start shrink-0')}>
            <div className={styles.inner}>
                <header className={styles.header}>
                    <h2 className={styles.heading}>
                        Our Journal
                    </h2>

                    <div className={styles.actions}>
                        {isHim(user?.email) && (
                            <Button
                                variant="outline"
                                aria-pressed={showDeletedLogs}
                                onClick={() => setShowDeletedLogs(!showDeletedLogs)}
                                className={styles.quietButton}
                            >
                                <History className="size-4" aria-hidden="true" />
                                {showDeletedLogs ? 'Nhật ký' : 'Thùng rác'}
                            </Button>
                        )}

                        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(styles.quietButton, 'size-11 p-0')}
                                    aria-label="Cài đặt Nhật ký"
                                >
                                    <Settings className="size-4" aria-hidden="true" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className={cn('heart-glass-surface w-[calc(100%-1.5rem)] sm:max-w-[500px] max-h-[90dvh] overflow-y-auto', styles.dialog)}>
                                <DialogTitle className="[font-family:var(--font-heart-display)] text-3xl mb-2 text-stone-800 text-center">
                                    Cài đặt nhật ký
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    Đổi tên và ảnh đại diện trong nhật ký.
                                </DialogDescription>

                                <div className="space-y-8">
                                    {/* HIM SETTINGS */}
                                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                        <div className="flex items-center gap-4 mb-4">
                                            <button
                                                type="button"
                                                aria-label="Đổi ảnh đại diện của Anh"
                                                className={cn('heart-glass-button', styles.avatarPicker)}
                                                onClick={() => {
                                                    setIsUploadingAvatar('him');
                                                    avatarInputRef.current?.click();
                                                }}
                                            >
                                                <span className={styles.avatarPickerPhoto} data-him="true">
                                                    {tempAvatars.him ? (
                                                        <Image src={tempAvatars.him} alt="" fill sizes="64px" className="object-cover" />
                                                    ) : (
                                                        <ImageIcon className="size-6" aria-hidden="true" />
                                                    )}
                                                </span>
                                                <span className={styles.avatarPickerMark} aria-hidden="true"><Upload size={12} /></span>
                                            </button>
                                            <div className="flex-1">
                                                <label className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1 block">Display Name (Him)</label>
                                                <input
                                                    value={tempNames.him}
                                                    onChange={(e) => setTempNames({ ...tempNames, him: e.target.value })}
                                                    className="w-full bg-white border border-blue-100 rounded-lg p-3 [font-family:var(--font-dancing)] text-2xl text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                    placeholder="Biệt danh cho Anh..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* HER SETTINGS */}
                                    <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
                                        <div className="flex items-center gap-4 mb-4">
                                            <button
                                                type="button"
                                                aria-label="Đổi ảnh đại diện của Em"
                                                className={cn('heart-glass-button', styles.avatarPicker)}
                                                onClick={() => {
                                                    setIsUploadingAvatar('her');
                                                    avatarInputRef.current?.click();
                                                }}
                                            >
                                                <span className={styles.avatarPickerPhoto}>
                                                    {tempAvatars.her ? (
                                                        <Image src={tempAvatars.her} alt="" fill sizes="64px" className="object-cover" />
                                                    ) : (
                                                        <ImageIcon className="size-6" aria-hidden="true" />
                                                    )}
                                                </span>
                                                <span className={styles.avatarPickerMark} aria-hidden="true"><Upload size={12} /></span>
                                            </button>
                                            <div className="flex-1">
                                                <label className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-1 block">Display Name (Her)</label>
                                                <input
                                                    value={tempNames.her}
                                                    onChange={(e) => setTempNames({ ...tempNames, her: e.target.value })}
                                                    className="w-full bg-white border border-rose-100 rounded-lg p-3 [font-family:var(--font-dancing)] text-2xl text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-100"
                                                    placeholder="Biệt danh cho Em..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <input
                                        type="file"
                                        ref={avatarInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                    />

                                    <Button onClick={saveSettings} className={cn(styles.primary, 'w-full')}>
                                        Lưu cài đặt
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isWriting} onOpenChange={(open) => open ? setIsWriting(true) : handleCloseWrite()}>
                            <DialogTrigger asChild>
                                <Button className={styles.primary}>
                                    <PenLine className="size-4" aria-hidden="true" />
                                    {editingId ? 'Sửa thư' : 'Viết thư'}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className={cn('heart-glass-surface w-[calc(100%-1.5rem)] sm:max-w-3xl p-0 overflow-hidden max-h-[90dvh] flex flex-col', styles.dialog)}>
                                {/* Header */}
                                <div className={cn('px-4 sm:px-8 pr-14 sm:pr-16 py-4 sm:py-6 border-b flex items-center justify-between relative overflow-hidden', styles.dialogBand)}>
                                    <div>
                                        <DialogTitle className="[font-family:var(--font-heart-display)] text-3xl text-stone-800 italic flex items-center gap-3">
                                            Gửi em <Heart className="w-5 h-5 text-rose-400 fill-rose-400 animate-pulse" />
                                        </DialogTitle>
                                        <DialogDescription className="text-stone-500 [font-family:var(--font-heart-ui)] text-lg mt-1">
                                            Thư của hai đứa.
                                        </DialogDescription>
                                    </div>
                                    <div className="hidden sm:flex size-12 shrink-0 rounded-full bg-stone-100 items-center justify-center border border-stone-200 shadow-inner">
                                        <BookHeart className="w-6 h-6 text-stone-400" />
                                    </div>
                                </div>

                                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative">
                                    <div className="px-4 pt-4 pb-4 sm:px-8 sm:pt-6">
                                        <div className="relative group">
                                            {/* Precise Lines Background */}
                                            <div
                                                className="absolute inset-0 pointer-events-none w-full h-full"
                                                style={{
                                                    backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, #e8e4d9 39px, #e8e4d9 40px)',
                                                    backgroundAttachment: 'local',
                                                }}
                                            />

                                            {/* Mood Indicator */}
                                            <div className="relative z-20 mb-2 flex justify-end">
                                                <div className={cn(
                                                    "flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 backdrop-blur-sm border shadow-sm transition-colors",
                                                    MOODS[currentMood].textColor.replace('text-', 'border-'),
                                                    MOODS[currentMood].textColor.replace('text-', 'bg-').replace('600', '50')
                                                )}>
                                                    {(() => {
                                                        const Icon = MOODS[currentMood].icon === 'Heart' ? HeartIcon :
                                                            MOODS[currentMood].icon === 'Sun' ? Sun :
                                                                MOODS[currentMood].icon === 'Cloud' ? CloudIcon :
                                                                    MOODS[currentMood].icon === 'CloudRain' ? CloudRain : PenLine;
                                                        return <Icon className={cn("w-4 h-4", MOODS[currentMood].textColor)} />;
                                                    })()}
                                                    <span className={cn("text-xs font-bold uppercase", MOODS[currentMood].textColor)}>
                                                        {currentMood}
                                                    </span>
                                                </div>
                                            </div>

                                            <Textarea
                                                value={newEntry}
                                                onChange={(e) => {
                                                    setNewEntry(e.target.value);
                                                    setCurrentMood(detectMood(e.target.value));
                                                }}
                                                placeholder="bắt đầu viết ở đây nè..."
                                                className="w-full min-h-[400px] border-0 bg-transparent text-2xl [font-family:var(--font-dancing)] text-stone-800 focus-visible:ring-0 resize-none placeholder:text-stone-300 placeholder:italic p-0 pl-2 leading-[40px] pt-[9px]"
                                                style={{ lineHeight: '40px' }}
                                                spellCheck={false}
                                            />

                                            {/* Media Previews */}
                                            {tempMedia.length > 0 && (
                                                <div className="flex gap-4 overflow-x-auto py-4 px-2 mt-4 bg-stone-50/50 rounded-xl border border-dashed border-stone-200 relative z-20">
                                                    {tempMedia.map((m, i) => (
                                                        <div key={i} className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden shadow-md group rotate-1 hover:rotate-0 transition-all duration-300">
                                                            {m.type === 'video' ? (
                                                                <video
                                                                    src={m.url}
                                                                    className="w-full h-full object-cover"
                                                                    muted
                                                                />
                                                            ) : (
                                                                <Image src={m.url} alt="preview" fill className="object-cover" />
                                                            )}
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            <button
                                                                onClick={() => removeMedia(i)}
                                                                type="button" aria-label="Bỏ tệp đính kèm" className={cn('heart-glass-button', styles.deletePhoto)}
                                                            >
                                                                <X aria-hidden="true" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>


                                    </div>
                                </div>

                                <div className={cn('p-3 sm:p-6 border-t flex flex-wrap gap-2 justify-between items-center z-20', styles.dialogBand)}>
                                    <div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept="image/*,video/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <Button
                                            variant="ghost"
                                            onClick={() => fileInputRef.current?.click()}
                                            className={styles.quietButton}
                                        >
                                            <Paperclip className="w-4 h-4 mr-1 sm:mr-2" />
                                            Đính kèm
                                        </Button>
                                    </div>

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!newEntry.trim() && tempMedia.length === 0}
                                        className={styles.primary}
                                    >
                                        <Send className="w-4 h-4 mr-2" /> Gửi thư
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </header>

                <div className={styles.scrollArea}>
                    {loading ? (
                        <div className={styles.empty} role="status">
                            <Loader2 className="animate-spin" aria-hidden="true" />
                            <p>Đang mở hòm thư…</p>
                        </div>
                    ) : showDeletedLogs ? (
                        // DELETED LOGS VIEW
                        displayedDeletedLogs.length === 0 ? (
                            <div className={styles.empty}>
                                <Trash2 aria-hidden="true" />
                                <p>Thùng rác trống.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="text-center [font-family:var(--font-heart-display)] italic text-stone-400 mb-6">- Deleted Messages -</h3>
                                {displayedDeletedLogs.map((log) => (
                                    <div key={log.id} className="bg-stone-100/50 p-6 rounded-lg border border-stone-200 opacity-70 hover:opacity-100 transition-opacity">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="[font-family:var(--font-heart-ui)] text-xs font-bold uppercase tracking-widest text-stone-400">
                                                Deleted by {isHim(log.deletedBy === user?.uid ? user?.email : '') ? "Him" : "Her"}
                                            </span>
                                            <span className="text-[10px] text-stone-400">
                                                {log.deletedAt ? format(new Date(log.deletedAt as unknown as number), 'MMM dd, HH:mm') : ''}
                                            </span>
                                        </div>
                                        <p className="[font-family:var(--font-heart-ui)] text-lg text-stone-600 line-through decoration-stone-300 mb-2">
                                            {log.text}
                                        </p>
                                        <div className="text-[10px] text-stone-400 font-mono">
                                            Original ID: {log.originalEntryId}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : displayedEntries.length === 0 ? (
                        <div className={styles.empty}>
                            <PenLine aria-hidden="true" />
                            <p>Chưa có lá thư nào.</p>
                        </div>
                    ) : (
                        <div className={styles.journalGrid}>
                            {displayedEntries.map((entry, index) => {
                                const him = isHim(entry.authorEmail);
                                const name = him ? displayNames.him : displayNames.her;
                                const avatar = him ? avatars.him : avatars.her;
                                const date = entry.createdAt ? new Date(entry.createdAt) : null;

                                return (
                                    <article key={entry.id} className={cn('heart-glass-surface', styles.letterCard)}>
                                        <header className={styles.letterHead}>
                                            <span className={styles.avatar} data-him={Boolean(him)} aria-hidden="true">
                                                {avatar ? <Image src={avatar} alt="" fill sizes="42px" /> : name.slice(0, 1)}
                                            </span>
                                            <div className={styles.letterMeta}>
                                                <h3 className={styles.letterTitle}>Lời của {name}</h3>
                                                {date && <time className={styles.date} dateTime={format(date, 'yyyy-MM-dd')}>{format(date, 'dd.MM.yyyy')}</time>}
                                            </div>
                                            {index === 0 ? (
                                                <Image src="/heart-glass/envelope.webp" width={136} height={136} alt="" className={styles.letterArt} />
                                            ) : (
                                                <Mail className={styles.letterSeal} aria-hidden="true" />
                                            )}
                                        </header>

                                        <p className={styles.letterText}>{entry.text}</p>

                                        <footer className={styles.letterFoot}>
                                            {entry.media && entry.media.length > 0 && (
                                                <span className={styles.attachmentCount}>
                                                    <Paperclip aria-hidden="true" />
                                                    {entry.media.length} tệp
                                                </span>
                                            )}
                                            <button type="button" className={styles.readButton} aria-label={`Mở thư của ${name}`} onClick={() => setSelectedEntry(entry)}>
                                                <span className={cn('heart-glass-button', styles.readButtonSurface)}>
                                                    Mở thư <ChevronRight aria-hidden="true" />
                                                </span>
                                            </button>
                                        </footer>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {/* Infinite Scroll Trigger & Skeleton Loaders */}
                    {hasMore && (
                        <div ref={observerRef} className="pt-8 pb-32">
                            {loading && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
                                    <LetterSkeleton />
                                    <LetterSkeleton />
                                </div>
                            )}
                        </div>
                    )}

                    {!hasMore && !showDeletedLogs && displayedEntries.length > 0 && (
                        <div className={styles.journalEnd}>
                            <Button
                                type="button"
                                variant="outline"
                                className={styles.quietButton}
                                onClick={event => event.currentTarget.closest('.snap-x')?.scrollBy({
                                    left: window.innerWidth,
                                    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
                                })}
                            >
                                Sweet Moments <ChevronRight className="size-4" aria-hidden="true" />
                            </Button>
                        </div>
                    )}
                </div>
                <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
                    <DialogContent className={cn('heart-glass-surface w-[calc(100%-1.5rem)] sm:max-w-3xl p-0 overflow-hidden max-h-[90dvh] flex flex-col', styles.dialog)}>
                        {/* Header */}
                        <div className={cn('px-4 sm:px-8 pr-14 sm:pr-16 py-4 sm:py-6 border-b flex items-center justify-between relative overflow-hidden', styles.dialogBand)}>
                            <div className="flex min-w-0 items-center gap-3 relative z-10">
                                <div className={cn(
                                    "relative w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-sm",
                                    isHim(selectedEntry?.authorEmail) ? "bg-blue-50 border-blue-100 text-blue-500" : "bg-rose-50 border-rose-100 text-rose-500"
                                )}>
                                    {(isHim(selectedEntry?.authorEmail) && avatars.him) || (!isHim(selectedEntry?.authorEmail) && avatars.her) ? (
                                        <Image
                                            src={isHim(selectedEntry?.authorEmail) ? avatars.him : avatars.her}
                                            alt="Avatar"
                                            fill
                                            className="object-cover rounded-full"
                                        />
                                    ) : (
                                        <span className="[font-family:var(--font-dancing)] font-bold text-xl">
                                            {isHim(selectedEntry?.authorEmail) ? displayNames.him : displayNames.her}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <DialogTitle className={cn(
                                        "[font-family:var(--font-heart-display)] text-2xl italic flex items-center gap-2",
                                        isHim(selectedEntry?.authorEmail) ? "text-blue-900" : "text-rose-900"
                                    )}>
                                        {isHim(selectedEntry?.authorEmail) ? `Lời của ${displayNames.him}` : `Lời của ${displayNames.her}`}
                                    </DialogTitle>
                                    <DialogDescription className="text-stone-400 [font-family:var(--font-heart-ui)] text-xs uppercase tracking-wider mt-1">
                                        {selectedEntry?.createdAt && format(new Date(selectedEntry.createdAt as unknown as number), 'EEEE, MMM dd, yyyy • h:mm a')}
                                    </DialogDescription>
                                </div>
                            </div>

                            <div className="hidden sm:block opacity-20 rotate-12">
                                {isHim(selectedEntry?.authorEmail) ? <Cloud className="w-16 h-16 text-blue-400" /> : <Heart className="w-16 h-16 text-rose-400" />}
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
                            {/* Mood Atmosphere - Absolute Background Layer */}
                            <div className="absolute inset-0 pointer-events-none z-0">
                                <MoodAtmosphere mood={(!selectedEntry?.mood || selectedEntry?.mood === 'default') ? detectMood(selectedEntry?.text || '') : selectedEntry.mood} />
                            </div>

                            {/* Scrollable Content Layer */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">

                                <div className="p-4 sm:p-8 pb-10 sm:pb-12 relative z-10">
                                    <div className="relative min-h-[300px]">
                                        {/* Precise Lines Background */}
                                        <div
                                            className="absolute inset-0 pointer-events-none w-full h-full -z-10"
                                            style={{
                                                backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, #e8e4d9 39px, #e8e4d9 40px)',
                                                backgroundAttachment: 'local',
                                            }}
                                        />

                                        <p className="text-2xl [font-family:var(--font-dancing)] leading-[40px] text-stone-800 whitespace-pre-wrap [overflow-wrap:anywhere] relative z-10 pl-2 pt-[9px]">
                                            {selectedEntry?.text}
                                        </p>
                                    </div>

                                    {/* Detailed Gallery */}
                                    {selectedEntry?.media && selectedEntry.media.length > 0 && (
                                        <div className="mt-12">
                                            <div className="flex items-center gap-2 mb-4 text-stone-400 [font-family:var(--font-heart-ui)] text-xs uppercase tracking-widest font-bold">
                                                <Paperclip className="w-4 h-4" /> Ảnh và video
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedEntry.media.map((m, i) => (
                                                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden shadow-md border-4 border-white bg-stone-100 group">
                                                        {m.type === 'video' ? (
                                                            <video src={m.url} controls className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Image src={m.url} alt="attachment" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={cn('p-3 sm:p-6 border-t flex flex-wrap gap-2 justify-between items-center relative z-20', styles.dialogBand)}>
                            <div className="flex gap-1 sm:gap-4 items-center">
                                {user?.uid === selectedEntry?.authorId && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => handleDelete(e, selectedEntry!.id)}
                                            className={cn(styles.quietButton, styles.dangerText)}
                                        >
                                            Delete
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(selectedEntry!)}
                                            className={styles.quietButton}
                                        >
                                            Edit
                                        </Button>
                                    </>
                                )}
                            </div>
                            <Button variant="outline" onClick={() => setSelectedEntry(null)} className={styles.quietButton}>Đóng thư</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
                    <DialogContent className={cn('heart-glass-surface w-[calc(100%-1.5rem)] sm:max-w-md p-5 sm:p-8', styles.dialog)}>
                        <div className="flex flex-col items-center text-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 shadow-sm">
                                <AlertTriangle className="w-7 h-7 text-red-500 stroke-[1.5]" />
                            </div>
                            <DialogTitle className="[font-family:var(--font-heart-display)] text-2xl font-bold text-stone-800 mb-2">
                                Move to Trash?
                            </DialogTitle>
                            <DialogDescription className="text-stone-500 [font-family:var(--font-heart-ui)] text-lg leading-relaxed max-w-xs mx-auto">
                                Lá thư này sẽ được chuyển vào thùng rác. Bạn vẫn có thể xem lại nó ở đó nhé.
                            </DialogDescription>

                            <div className="flex gap-3 w-full mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => setDeleteConfirmation(null)}
                                    className={cn(styles.quietButton, 'flex-1')}
                                >
                                    Keep It
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={confirmDelete}
                                    className={cn(styles.primary, 'flex-1')}
                                >
                                    Yes, Delete
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

            </div>

        </section>
    );
}
