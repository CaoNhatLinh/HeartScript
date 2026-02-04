'use client';

import { useCollection } from '@/hooks/useCollection';
import { Project } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { Code as CodeIcon, Terminal, Plus, ExternalLink, Wand2, Eye, EyeOff, Maximize2, Trash2, Clock, Lock, Unlock, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { push, ref, set, update, remove, query, orderByChild } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { useState, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { HIM_EMAILS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';

// Dynamic Import for heavy 3D components to avoid hydration issues and initial bundle bloat
const ValentineEntry = dynamic(() => import('../miniprojects/valentine/ValentineEntry'), {
    loading: () => (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-white gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
            <p className="font-mono text-zinc-400 animate-pulse">Initializing 3D Environment...</p>
        </div>
    ),
    ssr: false // 3D is client-only
});

// --- COMPONENTS ---

// Optimized Fullscreen Portal with Cleanup
const FullscreenOverlay = memo(({ project, onClose }: { project: Project; onClose: () => void }) => {
    // Escape key listener for fast content performance
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'F11') e.preventDefault(); // Prevent browser fullscreen conflict if needed
        };
        window.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden'; // Lock scroll

        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = ''; // Restore scroll
        };
    }, [onClose]);

    if (typeof window === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black animate-in fade-in duration-500 fill-mode-forwards">
            {/* Content Container */}
            <div className="absolute inset-0 z-0">
                {project.id === 'valentine-3d' ? (
                    <ValentineEntry />
                ) : (
                    <iframe
                        className="w-full h-full border-0 bg-white"
                        srcDoc={project.code}
                        title="Project Fullscreen"
                        sandbox="allow-scripts allow-modals"
                    />
                )}
            </div>

            {/* Floating Controls */}
            <div className="absolute top-6 right-6 z-[10000] flex gap-4">
                <button
                    onClick={onClose}
                    className="group flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-red-500/90 text-white/80 hover:text-white rounded-full backdrop-blur-md transition-all border border-white/10 hover:border-red-500/50 shadow-lg"
                >
                    <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">Close</span>
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Hint Overlay (Fades out) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none animate-out fade-out duration-1000 delay-[3000ms] fill-mode-forwards">
                <div className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/5 text-xs text-white/50 font-mono">
                    Press ESC to exit
                </div>
            </div>
        </div>,
        document.body
    );
});
FullscreenOverlay.displayName = 'FullscreenOverlay';

export function ProjectsSection() {
    const { user } = useAuthStore();
    const { data: projects, loading } = useCollection<Project>('projects', (qRef) =>
        query(qRef, orderByChild('createdAt'))
    );

    const [minDate] = useState(() => new Date().toISOString().slice(0, 16));
    const [currentTime, setCurrentTime] = useState(() => Date.now());

    // UI States
    const [activeFullscreenProject, setActiveFullscreenProject] = useState<Project | null>(null);
    const [scheduleProject, setScheduleProject] = useState<Project | null>(null);
    const [unlockDateTime, setUnlockDateTime] = useState<string>('');

    // Update time for lock status
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const isHim = user?.email && HIM_EMAILS.includes(user.email);
    const dbProjects = [...projects].reverse();
    const availableMiniProjects = ['valentine-3d'];

    // Merge system projects with DB config
    const visibleProjects = (() => {
        const defaultSpecialProjects: Project[] = availableMiniProjects.map(id => ({
            id,
            title: id === 'valentine-3d' ? 'Valentine 3D Room' : 'Unknown Project',
            description: id === 'valentine-3d' ? 'A magical 3D world with roses, floating memories and interactive gifts.' : 'Description not available',
            code: '',
            type: 'react' as const,
            isVisibleToHer: false,
            createdAt: 1707868800000,
            userId: 'system'
        }));

        const merged = defaultSpecialProjects.map(defaultProj => {
            const dbProj = dbProjects.find(p => p.id === defaultProj.id);
            if (!dbProj) return defaultProj;
            return { ...defaultProj, ...dbProj, title: dbProj.title || defaultProj.title };
        });

        // Combine with user-created projects
        const all = [...new Map([...merged, ...dbProjects].map(p => [p.id, p])).values()];

        return isHim ? all : all.filter(p => p.isVisibleToHer);
    })();

    // --- ACTIONS ---

    const handleOpenPopup = useCallback((project: Project) => {
        const width = Math.min(window.screen.width * 0.9, 1600);
        const height = Math.min(window.screen.height * 0.9, 900);
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        const popup = window.open(
            `/miniproject/${project.id}`,
            `MiniProject_${project.id}`,
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no`
        );

        if (popup) {
            // Focus new window
            popup.focus();

            // Simple monitoring for cleanup hooks if needed in future
            const timer = setInterval(() => {
                if (popup.closed) {
                    clearInterval(timer);
                    // console.log('Popup closed');
                }
            }, 1000);
        }
    }, []);

    const handleScheduleSubmit = async () => {
        if (!scheduleProject?.id) return;
        const unlockDate = unlockDateTime ? new Date(unlockDateTime).getTime() : null;
        try {
            await update(ref(rtdb, `projects/${scheduleProject.id}`), { unlockDate });
            setScheduleProject(null);
            setUnlockDateTime('');
        } catch (error) {
            console.error("Schedule failed:", error);
            alert('Failed to update schedule');
        }
    };

    const handleCreate = async () => {
        if (!user) return;
        const newRef = push(ref(rtdb, 'projects'));
        await set(newRef, {
            title: 'New Love Spell',
            description: 'A magical interaction for us.',
            code: '<h1>New Magic</h1>',
            type: 'html',
            isVisibleToHer: false,
            createdAt: Date.now(),
            unlockDate: null,
            userId: user.uid
        });
    };

    const toggleVisibility = async (project: Project) => {
        if (!project.id) return;
        await update(ref(rtdb, `projects/${project.id}`), { isVisibleToHer: !project.isVisibleToHer });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this project?')) await remove(ref(rtdb, `projects/${id}`));
    };

    return (
        <section className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 snap-start shrink-0 relative border-l border-zinc-800" suppressHydrationWarning>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-zinc-950 pointer-events-none" />

            <div className="z-10 w-full max-w-6xl p-8 h-full flex flex-col justify-center">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 shrink-0">
                    <div>
                        <h2 className="text-3xl font-mono font-bold text-indigo-400 flex items-center gap-3">
                            <Terminal className="w-8 h-8" />
                            {isHim ? 'Control Center' : 'Our Creations'}
                        </h2>
                        <p className="text-zinc-500 font-mono mt-2 text-sm">
                            {isHim ? '> System Status: Online. Ready to code.' : '> Exploring our digital universe...'}
                        </p>
                    </div>
                    {isHim && (
                        <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono">
                            <Plus className="w-4 h-4 mr-2" /> New Project
                        </Button>
                    )}
                </div>

                {/* Project List */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-40 text-zinc-600 font-mono gap-3">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Loading modules...
                        </div>
                    ) : visibleProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-700 font-mono border-2 border-dashed border-zinc-800 rounded-xl p-10">
                            <CodeIcon className="w-12 h-12 mb-4 opacity-50" />
                            <p>No active modules found.</p>
                        </div>
                    ) : (
                        <div className={cn(
                            "grid gap-6",
                            isHim ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                        )}>
                            {visibleProjects.map((project, index) => {
                                // Deterministic aesthetic for Her
                                const gradients = [
                                    "from-pink-500 via-rose-500 to-yellow-500",
                                    "from-blue-400 via-indigo-500 to-purple-500",
                                    "from-emerald-400 via-cyan-500 to-blue-500",
                                    "from-orange-400 via-pink-500 to-purple-500"
                                ];
                                const gradient = gradients[index % gradients.length];
                                const isLocked = project.unlockDate && (project.unlockDate as number) > currentTime;

                                return isHim ? (
                                    // HIM VIEW (Admin List)
                                    <div key={project.id} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-lg flex items-center justify-between group hover:border-indigo-500/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-2 h-2 rounded-full", project.isVisibleToHer ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-orange-500")} />
                                            {isLocked && <Lock className="w-4 h-4 text-yellow-500" />}
                                            <div>
                                                <h3 className="font-mono text-zinc-200 font-bold">{project.title}</h3>
                                                <p className="text-xs text-zinc-500 truncate max-w-[300px]">{project.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => project.unlockDate ? handleScheduleSubmit() : setScheduleProject(project)}
                                                className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20"
                                                title={project.unlockDate ? "Cancel Schedule" : "Set Schedule"}
                                            >
                                                {project.unlockDate ? <Unlock className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                            </Button>

                                            {/* DIRECT ACCESS BUTTONS (HIM) */}
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setActiveFullscreenProject(project)}
                                                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20"
                                                title="Open Fullscreen"
                                            >
                                                <Maximize2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleOpenPopup(project)}
                                                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20"
                                                title="Open in New Window"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>

                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => toggleVisibility(project)}
                                                className={cn(project.isVisibleToHer ? "text-green-500 hover:text-green-400" : "text-zinc-500 hover:text-zinc-400")}
                                            >
                                                {project.isVisibleToHer ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleDelete(project.id)}
                                                className="text-red-900 hover:text-red-500 hover:bg-red-950/30"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    // HER VIEW (Showcase Cards)
                                    <div key={project.id} className="group relative bg-zinc-900 border-0 p-1 rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-500 shadow-2xl">
                                        {/* Dynamic Gradient Border/Background */}
                                        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-20 group-hover:opacity-100 transition-opacity duration-500", gradient)} />

                                        <div className="relative z-10 bg-zinc-950/90 h-full p-6 rounded-xl flex flex-col justify-between backdrop-blur-sm">
                                            {isLocked ? (
                                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                                                    <div className="p-6 bg-yellow-500/10 rounded-full border-2 border-yellow-500/20">
                                                        <Lock className="w-12 h-12 text-yellow-500" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                                                        <p className="text-zinc-400 text-sm">Unlocks on {new Date(project.unlockDate as number).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div>
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br text-white shadow-lg", gradient)}>
                                                                <Wand2 className="w-5 h-5" />
                                                            </div>
                                                            <span className="px-2 py-1 rounded-full text-[10px] font-bold tracking-widest bg-white/5 text-white/50 border border-white/10">MAGIC</span>
                                                        </div>

                                                        <h3 className="text-xl font-bold text-white mb-2 font-sans tracking-tight">
                                                            {project.title}
                                                        </h3>
                                                        <p className="text-zinc-400 text-sm leading-relaxed mb-6 line-clamp-3">{project.description}</p>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {/* DIRECT ACCESS BUTTONS (HER) */}
                                                        <Button
                                                            onClick={() => setActiveFullscreenProject(project)}
                                                            className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/30 transition-all font-medium text-xs group/btn relative overflow-hidden h-10"
                                                        >
                                                            <span className="relative z-10 flex items-center justify-center">
                                                                Fullscreen <Maximize2 className="w-3 h-3 ml-2 group-hover/btn:scale-110 transition-transform" />
                                                            </span>
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleOpenPopup(project)}
                                                            className="flex-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/30 transition-all font-medium text-xs group/btn relative overflow-hidden h-10"
                                                        >
                                                            <span className="relative z-10 flex items-center justify-center">
                                                                Window <ExternalLink className="w-3 h-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                                            </span>
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* OPTIMIZED FULLSCREEN PORTAL */}
            {activeFullscreenProject && (
                <FullscreenOverlay project={activeFullscreenProject} onClose={() => setActiveFullscreenProject(null)} />
            )}

            {/* SCHEDULE DIALOG */}
            <Dialog open={!!scheduleProject} onOpenChange={(open) => !open && setScheduleProject(null)}>
                <DialogContent className="max-w-md bg-zinc-950 border-zinc-800">
                    <DialogHeader>
                        <DialogTitle className="font-mono text-zinc-200 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            Set Unlock Schedule
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Schedule when this project will be unlocked
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Project: {scheduleProject?.title}
                            </label>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Unlock Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                value={unlockDateTime}
                                onChange={(e) => setUnlockDateTime(e.target.value)}
                                min={minDate}
                                step="60"
                                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-zinc-500 mt-1">Leave empty to unlock immediately</p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setScheduleProject(null)} className="text-zinc-400 hover:text-zinc-300">
                                Cancel
                            </Button>
                            <Button onClick={handleScheduleSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                Set Schedule
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
}
