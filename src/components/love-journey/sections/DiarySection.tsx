'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { push, ref, set, update, query, limitToLast, orderByChild, serverTimestamp, onValue } from 'firebase/database';
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

export function DiarySection() {
    const { user } = useAuthStore();
    const [limitCount, setLimitCount] = useState(5);
    const { data: entries, loading } = useCollection<JournalEntry>('journal', (qRef) =>
        query(qRef, orderByChild('createdAt'), limitToLast(limitCount))
    );
    // Filter out deleted entries and reverse for latest first
    const displayedEntries = [...entries].filter(entry => !entry.isDeleted).reverse();
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
                await update(ref(rtdb, `journal/${editingId}`), {
                    text: newEntry,
                    media: uploadedMedia,
                    updatedAt: serverTimestamp(),
                    updatedBy: user.uid
                });
                setEditingId(null);
            } else {
                // Create new entry
                const newRef = push(ref(rtdb, 'journal'));
                await set(newRef, {
                    text: newEntry,
                    media: uploadedMedia,
                    createdAt: serverTimestamp(),
                    authorEmail: user.email,
                    authorId: user.uid
                });
            }

            setNewEntry('');
            setTempMedia([]);
            setIsWriting(false);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to send letter. Please try again.');
        }
    };

    const handleEdit = (entry: JournalEntry) => {
        setNewEntry(entry.text);
        setTempMedia(entry.media || []);
        setEditingId(entry.id);
        setSelectedEntry(null); // Close view dialog
        setIsWriting(true); // Open write dialog
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
                originalEntryId: entryToDelete.id,
                text: entryToDelete.text,
                media: entryToDelete.media,
                createdAt: entryToDelete.createdAt,
                authorEmail: entryToDelete.authorEmail,
                authorId: entryToDelete.authorId,
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
        <section className="h-screen w-screen flex flex-col relative overflow-hidden bg-[#faf9f6] snap-start shrink-0" suppressHydrationWarning>
            {/* Load Fonts */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&family=Google+Sans+Code:ital,wght@0,300..800;1,300..800&family=Playwrite+IN+Guides&family=Playwrite+NZ+Basic+Guides&display=swap');
            `}</style>

            {/* Background Style */}
            <div className="absolute inset-0 opacity-[0.6] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-100/30 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/30 blur-[120px] rounded-full pointer-events-none" />

            <div className="h-full w-full max-w-4xl mx-auto p-6 md:p-8 flex flex-col relative z-10">
                {/* Header Section */}
                <div className="mb-8 flex-shrink-0">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="relative">
                            <h2 className="text-5xl md:text-6xl font-['Dancing_Script'] font-bold text-stone-800 flex items-center gap-4 justify-center drop-shadow-sm">
                                <span className="text-rose-400">Our</span> Journal
                            </h2>
                            <div className="absolute -top-6 -right-8 opacity-20 rotate-12">
                                <Heart className="w-16 h-16 text-rose-500 fill-rose-500" />
                            </div>
                        </div>
                        <p className="text-stone-500 font-['Patrick_Hand'] text-xl mt-2 tracking-wide">
                            Gửi những yêu thương vào từng trang giấy...
                        </p>
                    </div>

                    <div className="flex justify-center gap-4 items-center">
                        {/* Only HIM can see the Trash Can */}
                        {isHim(user?.email) && (
                            <Button
                                variant="ghost"
                                onClick={() => setShowDeletedLogs(!showDeletedLogs)}
                                className={cn(
                                    "rounded-full font-['Montserrat'] text-xs uppercase tracking-widest px-6 py-2 transition-all",
                                    showDeletedLogs
                                        ? "bg-red-100 text-red-500 hover:bg-red-200"
                                        : "text-stone-500 hover:text-stone-700 hover:bg-stone-100"
                                )}
                            >
                                <History className="w-4 h-4 mr-2" />
                                {showDeletedLogs ? 'Back to Journal' : 'Trash Can'}
                            </Button>
                        )}

                        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="rounded-full border-stone-200 text-stone-500 hover:text-stone-800 hover:border-stone-400 hover:bg-white bg-white/50 backdrop-blur-sm p-3 shadow-sm transition-all group"
                                    title="Couple Settings"
                                >
                                    <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] bg-[#fffbf0] border-none font-serif max-h-[90vh] overflow-y-auto custom-scrollbar">
                                <DialogTitle className="font-['Playfair_Display'] text-3xl mb-2 text-stone-800 text-center">
                                    Our Little Settings
                                </DialogTitle>
                                <DialogDescription className="font-['Patrick_Hand'] text-xl text-stone-500 mb-8 text-center">
                                    Tùy chỉnh không gian riêng của chúng mình...
                                </DialogDescription>

                                <div className="space-y-8">
                                    {/* HIM SETTINGS */}
                                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="relative group cursor-pointer" onClick={() => { setIsUploadingAvatar('him'); avatarInputRef.current?.click(); }}>
                                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-200 shadow-sm bg-white">
                                                    {tempAvatars.him ? (
                                                        <Image src={tempAvatars.him} alt="Him" fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-300">
                                                            <ImageIcon className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Upload className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1 block">Display Name (Him)</label>
                                                <input
                                                    value={tempNames.him}
                                                    onChange={(e) => setTempNames({ ...tempNames, him: e.target.value })}
                                                    className="w-full bg-white border border-blue-100 rounded-lg p-3 font-['Dancing_Script'] text-2xl text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                    placeholder="Biệt danh cho Anh..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* HER SETTINGS */}
                                    <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="relative group cursor-pointer" onClick={() => { setIsUploadingAvatar('her'); avatarInputRef.current?.click(); }}>
                                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-rose-200 shadow-sm bg-white">
                                                    {tempAvatars.her ? (
                                                        <Image src={tempAvatars.her} alt="Her" fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-300">
                                                            <ImageIcon className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Upload className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-1 block">Display Name (Her)</label>
                                                <input
                                                    value={tempNames.her}
                                                    onChange={(e) => setTempNames({ ...tempNames, her: e.target.value })}
                                                    className="w-full bg-white border border-rose-100 rounded-lg p-3 font-['Dancing_Script'] text-2xl text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-100"
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

                                    <Button onClick={saveSettings} className="w-full bg-stone-800 text-white hover:bg-black rounded-xl py-6 font-['Montserrat'] font-bold text-xs uppercase tracking-widest shadow-lg shadow-stone-200">
                                        Save Everything
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isWriting} onOpenChange={(open) => {
                            if (!open) {
                                tempMedia.forEach(media => {
                                    if (media.url.startsWith('blob:')) {
                                        URL.revokeObjectURL(media.url);
                                    }
                                });
                                setTempMedia([]);
                                setNewEntry('');
                                setEditingId(null);
                            }
                            setIsWriting(open);
                        }}>
                            <DialogTrigger asChild>
                                <Button className="relative overflow-hidden rounded-full bg-stone-800 text-[#fffcf5] hover:bg-stone-900 font-['Playfair_Display'] px-10 py-6 text-lg shadow-xl shadow-stone-200 transition-all hover:scale-105 active:scale-95 group">
                                    <span className="relative z-10 flex items-center">
                                        <PenLine className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                                        {editingId ? "Update Love Letter" : "Write a Love Letter"}
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-stone-700 to-stone-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-3xl bg-[#fffbf0] border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col font-serif">
                                {/* Header */}
                                <div className="bg-[#fff9e6] px-8 py-6 border-b border-[#e6e2d1] flex items-center justify-between relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
                                    <div>
                                        <DialogTitle className="font-['Playfair_Display'] text-3xl text-stone-800 italic flex items-center gap-3">
                                            Dear My Love... <Heart className="w-5 h-5 text-rose-400 fill-rose-400 animate-pulse" />
                                        </DialogTitle>
                                        <DialogDescription className="text-stone-500 font-['Patrick_Hand'] text-lg mt-1">
                                            Viết cho tình yêu của chúng mình...
                                        </DialogDescription>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200 shadow-inner">
                                        <BookHeart className="w-6 h-6 text-stone-400" />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fffbf0] relative">
                                    <div className="p-8 pb-4">
                                        <div className="relative group">
                                            {/* Precise Lines Background */}
                                            <div
                                                className="absolute inset-0 pointer-events-none w-full h-full"
                                                style={{
                                                    backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, #e8e4d9 39px, #e8e4d9 40px)',
                                                    backgroundAttachment: 'local',
                                                }}
                                            />

                                            <Textarea
                                                value={newEntry}
                                                onChange={(e) => setNewEntry(e.target.value)}
                                                placeholder="bắt đầu viết ở đây nè..."
                                                className="w-full min-h-[400px] border-0 bg-transparent text-2xl font-['Dancing_Script'] text-stone-800 focus-visible:ring-0 resize-none placeholder:text-stone-300 placeholder:italic p-0 pl-2 leading-[40px] pt-[9px]"
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
                                                                className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1 shadow-lg hover:bg-rose-600 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>


                                    </div>
                                </div>

                                <div className="p-6 bg-white border-t border-stone-100 flex justify-between items-center z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
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
                                            className="text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl"
                                        >
                                            <Paperclip className="w-5 h-5 mr-2" />
                                            Attach Photos/Videos
                                        </Button>
                                    </div>

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!newEntry.trim() && tempMedia.length === 0}
                                        className="rounded-full bg-stone-800 text-[#fffcf5] hover:bg-black px-8 py-6 shadow-lg shadow-stone-200 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 font-['Montserrat'] tracking-wide uppercase text-xs font-bold"
                                    >
                                        <Send className="w-4 h-4 mr-2" /> Send Letter
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Journal List or Deleted Logs */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8 pb-32">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
                                <p className="text-stone-400 font-['Dancing_Script'] text-2xl">Đang mở hòm thư...</p>
                            </div>
                        ) : showDeletedLogs ? (
                            // DELETED LOGS VIEW
                            displayedDeletedLogs.length === 0 ? (
                                <div className="text-center py-20 text-stone-300 italic flex flex-col items-center gap-4">
                                    <Trash2 className="w-12 h-12 opacity-20" />
                                    <p className="font-['Dancing_Script'] text-2xl">Thùng rác trống rỗng.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h3 className="text-center font-['Playfair_Display'] italic text-stone-400 mb-6">- Deleted Messages -</h3>
                                    {displayedDeletedLogs.map((log) => (
                                        <div key={log.id} className="bg-stone-100/50 p-6 rounded-lg border border-stone-200 opacity-70 hover:opacity-100 transition-opacity">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-['Montserrat'] text-xs font-bold uppercase tracking-widest text-stone-400">
                                                    Deleted by {isHim(log.deletedBy === user?.uid ? user?.email : '') ? "Him" : "Her"}
                                                </span>
                                                <span className="text-[10px] text-stone-400">
                                                    {log.deletedAt ? format(new Date(log.deletedAt as unknown as number), 'MMM dd, HH:mm') : ''}
                                                </span>
                                            </div>
                                            <p className="font-['Patrick_Hand'] text-lg text-stone-600 line-through decoration-stone-300 mb-2">
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
                            <div className="text-center py-20 text-stone-300 italic flex flex-col items-center gap-4">
                                <PenLine className="w-12 h-12 opacity-20" />
                                <p className="font-['Dancing_Script'] text-2xl">Chưa có lá thư nào cả. Viết lá thư đầu tiên đi nè!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
                                {displayedEntries.map((entry, idx) => {
                                    const him = isHim(entry.authorEmail);
                                    const rotation = idx % 2 === 0 ? '-rotate-1' : 'rotate-1';

                                    return (
                                        <motion.div
                                            key={entry.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                                            className={cn("group relative", rotation, "hover:rotate-0 transition-transform duration-500")}
                                            onClick={() => setSelectedEntry(entry)}
                                        >
                                            {/* Cute Tape Effect */}
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-[#fdf6e3]/80 backdrop-blur-sm shadow-sm opacity-90 z-20 rotate-2 transform border-l border-r border-[#e6e2d1]/50" />

                                            {/* Main Card - Postcard Style */}
                                            <div className={cn(
                                                "relative bg-[#fffbf0] rounded-sm p-6 shadow-[2px_4px_16px_-2px_rgba(0,0,0,0.08)] cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-[4px_8px_24px_-4px_rgba(0,0,0,0.12)] border border-[#f0ebe0]",
                                                "after:absolute after:inset-0 after:border-2 after:border-dashed after:border-stone-200 after:rounded-sm after:m-2 after:pointer-events-none"
                                            )}>
                                                {/* Paper Texture Overlay */}
                                                <div className="absolute inset-0 opacity-[0.4] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none" />

                                                <div className="relative z-10 flex flex-col h-full">
                                                    {/* Header */}
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-3">
                                                            {/* Avatar / Icon */}
                                                            <div className={cn(
                                                                "relative w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm",
                                                                him ? "bg-blue-50 border-blue-100 text-blue-500" : "bg-rose-50 border-rose-100 text-rose-500"
                                                            )}>
                                                                {(him && avatars.him) || (!him && avatars.her) ? (
                                                                    <Image
                                                                        src={him ? avatars.him : avatars.her}
                                                                        alt="Avatar"
                                                                        fill
                                                                        className="object-cover rounded-full"
                                                                    />
                                                                ) : (
                                                                    <span className="font-['Dancing_Script'] font-bold text-lg">
                                                                        {him ? displayNames.him : displayNames.her}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className={cn(
                                                                    "font-['Playfair_Display'] font-bold text-base leading-tight",
                                                                    him ? "text-blue-900" : "text-rose-900"
                                                                )}>
                                                                    {him ? `Lời của ${displayNames.him}` : `Lời của ${displayNames.her}`}
                                                                </p>
                                                                <p className="text-[11px] text-stone-400 font-['Montserrat'] uppercase tracking-wider">
                                                                    {entry.createdAt ? format(new Date(entry.createdAt as unknown as number), 'MMM dd, yyyy') : 'Recently'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Cute Stamp */}
                                                        <div className="opacity-80 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                                            {him ? (
                                                                <Cloud className="w-8 h-8 text-blue-200 fill-blue-50" />
                                                            ) : (
                                                                <Heart className="w-8 h-8 text-rose-200 fill-rose-50" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Handwritten Content Preview */}
                                                    <div className="flex-1 relative mb-4 overflow-hidden">
                                                        <p className="font-['Dancing_Script'] text-xl md:text-2xl text-stone-700 line-clamp-3 leading-relaxed group-hover:text-stone-900 transition-colors">
                                                            {entry.text}
                                                        </p>
                                                    </div>

                                                    {/* Footer Info */}
                                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-dashed border-stone-200">
                                                        {entry.media && entry.media.length > 0 ? (
                                                            <div className="flex items-center gap-1.5 text-stone-400 bg-stone-100/50 px-2 py-1 rounded-md">
                                                                <ImageIcon className="w-3.5 h-3.5" />
                                                                <span className="text-xs font-['Montserrat'] font-medium">{entry.media.length} photos</span>
                                                            </div>
                                                        ) : <div />}

                                                        <div className="flex items-center gap-1 text-stone-400 group-hover:text-rose-400 transition-colors font-['Dancing_Script'] text-lg">
                                                            <span>Read more</span>
                                                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Load More */}
                        {!loading && displayedEntries.length > 0 && (
                            <div className="pt-8 flex justify-center pb-20">
                                <Button
                                    variant="outline"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLimitCount(prev => prev + 5);
                                    }}
                                    disabled={loading}
                                    className="rounded-full border-stone-300 text-stone-500 hover:bg-white hover:border-rose-300 hover:text-rose-500 font-['Montserrat'] text-xs font-bold uppercase tracking-widest px-8 py-6 transition-all"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <History className="w-4 h-4 mr-2" />}
                                    Load Old Letters
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
                <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
                    <DialogContent className="sm:max-w-3xl bg-[#fffbf0] border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col font-serif">
                        {/* Header */}
                        <div className="bg-[#fff9e6] px-8 py-6 border-b border-[#e6e2d1] flex items-center justify-between relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
                            <div className="flex items-center gap-4 relative z-10">
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
                                        <span className="font-['Dancing_Script'] font-bold text-xl">
                                            {isHim(selectedEntry?.authorEmail) ? displayNames.him : displayNames.her}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <DialogTitle className={cn(
                                        "font-['Playfair_Display'] text-2xl italic flex items-center gap-2",
                                        isHim(selectedEntry?.authorEmail) ? "text-blue-900" : "text-rose-900"
                                    )}>
                                        {isHim(selectedEntry?.authorEmail) ? `Lời của ${displayNames.him}` : `Lời của ${displayNames.her}`}
                                    </DialogTitle>
                                    <DialogDescription className="text-stone-400 font-['Montserrat'] text-xs uppercase tracking-wider mt-1">
                                        {selectedEntry?.createdAt && format(new Date(selectedEntry.createdAt as unknown as number), 'EEEE, MMM dd, yyyy • h:mm a')}
                                    </DialogDescription>
                                </div>
                            </div>

                            <div className="opacity-20 rotate-12">
                                {isHim(selectedEntry?.authorEmail) ? <Cloud className="w-16 h-16 text-blue-400" /> : <Heart className="w-16 h-16 text-rose-400" />}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fffbf0] relative">
                            <div className="p-8 pb-12">
                                <div className="relative min-h-[300px]">
                                    {/* Precise Lines Background */}
                                    <div
                                        className="absolute inset-0 pointer-events-none w-full h-full"
                                        style={{
                                            backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, #e8e4d9 39px, #e8e4d9 40px)',
                                            backgroundAttachment: 'local',
                                        }}
                                    />

                                    <p className="text-2xl font-['Dancing_Script'] leading-[40px] text-stone-800 whitespace-pre-wrap relative z-10 pl-2 pt-[9px]">
                                        {selectedEntry?.text}
                                    </p>
                                </div>

                                {/* Detailed Gallery */}
                                {selectedEntry?.media && selectedEntry.media.length > 0 && (
                                    <div className="mt-12">
                                        <div className="flex items-center gap-2 mb-4 text-stone-400 font-['Montserrat'] text-xs uppercase tracking-widest font-bold">
                                            <Paperclip className="w-4 h-4" /> Posted Photos & Videos
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

                        <div className="p-6 bg-white border-t border-stone-100 flex justify-between items-center shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] relative z-20">
                            <div className="flex gap-4 items-center">
                                {user?.uid === selectedEntry?.authorId && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => handleDelete(e, selectedEntry!.id)}
                                            className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 font-['Montserrat'] text-[10px] uppercase font-bold tracking-widest"
                                        >
                                            Delete
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(selectedEntry!)}
                                            className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 font-['Montserrat'] text-[10px] uppercase font-bold tracking-widest"
                                        >
                                            Edit
                                        </Button>
                                    </>
                                )}
                            </div>
                            <Button variant="outline" onClick={() => setSelectedEntry(null)} className="font-['Playfair_Display'] italic border-stone-200 hover:bg-stone-50">Close Letter</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
                    <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl p-8 font-serif">
                        <div className="flex flex-col items-center text-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 shadow-sm">
                                <AlertTriangle className="w-7 h-7 text-red-500 stroke-[1.5]" />
                            </div>
                            <DialogTitle className="font-['Playfair_Display'] text-2xl font-bold text-stone-800 mb-2">
                                Move to Trash?
                            </DialogTitle>
                            <DialogDescription className="text-stone-500 font-['Patrick_Hand'] text-lg leading-relaxed max-w-xs mx-auto">
                                Lá thư này sẽ được chuyển vào thùng rác. Bạn vẫn có thể xem lại nó ở đó nhé.
                            </DialogDescription>

                            <div className="flex gap-3 w-full mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => setDeleteConfirmation(null)}
                                    className="flex-1 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50 font-['Montserrat'] text-[10px] font-bold uppercase tracking-widest h-11"
                                >
                                    Keep It
                                </Button>
                                <Button
                                    onClick={confirmDelete}
                                    className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-red-200 transition-all font-['Montserrat'] text-[10px] font-bold uppercase tracking-widest h-11"
                                >
                                    Yes, Delete
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

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
        </section >
    );
}
