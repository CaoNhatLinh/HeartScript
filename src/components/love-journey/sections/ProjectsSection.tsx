'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, Check, Clock3, Code2, ExternalLink, Eye, EyeOff, Loader2, Lock, Share2, Sparkles, Trash2, Unlock, X } from 'lucide-react';
import { orderByChild, query, ref, remove, update, type DatabaseReference } from 'firebase/database';
import { useCollection } from '@/hooks/useCollection';
import { useAuthStore } from '@/store/useAuthStore';
import type { Project } from '@/types';
import { HIM_EMAILS } from '@/lib/constants';
import { rtdb } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { birthdayProject } from '../miniprojects/birthday/birthday-release';
import styles from './projects.module.css';

const ValentineEntry = dynamic(() => import('../miniprojects/valentine/ValentineEntry'), {
    loading: () => (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-white gap-4">
            <Loader2 className="size-9 animate-spin text-rose-300 motion-reduce:animate-none" />
            <p className="text-zinc-300">Đang mở thế giới 3D…</p>
        </div>
    ),
    ssr: false,
});

const BUILTIN_PROJECTS: Project[] = [
    {
        id: 'valentine-3d',
        title: 'Valentine 3D Room',
        description: 'A magical 3D world with roses, floating memories and interactive gifts.',
        createdAt: 1707868800000,
        type: 'react',
        isVisibleToHer: false,
        userId: 'system',
    },
    {
        ...birthdayProject,
        createdAt: Date.UTC(2026, 10, 7),
        type: 'react',
        isVisibleToHer: true,
        userId: 'system',
    },
];

const projectQuery = (projects: DatabaseReference) => query(projects, orderByChild('createdAt'));
const projectPath = (id: string) => `/miniproject/${encodeURIComponent(id)}`;
const scheduleFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
const projectStatuses = {
    scheduled: { label: 'Hẹn mở', icon: Lock },
    visible: { label: 'Hiển thị', icon: Eye },
    hidden: { label: 'Đã ẩn', icon: EyeOff },
};

function toDateTimeInputValue(timestamp: number) {
    const date = new Date(timestamp);
    return new Date(timestamp - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function ProjectCover({ project }: { project: Project }) {
    const isBirthday = project.id === birthdayProject.id;
    const isValentine = project.id === 'valentine-3d';
    return (
        <div className={styles.cover} data-theme={isBirthday ? 'birthday' : isValentine ? 'valentine' : 'studio'} aria-hidden="true">
            <div className={styles.orbit} />
            <Sparkles className={styles.sparkle} size={21} strokeWidth={1.15} />
            <Sparkles className={styles.sparkleSmall} size={15} strokeWidth={1.2} />
            {isBirthday || isValentine ? (
                <Image
                    className={styles.coverArt}
                    src={isBirthday ? '/birthday/cake-citrus-lit.webp' : '/heart-glass/rose.webp'}
                    width={isBirthday ? 995 : 800}
                    height={isBirthday ? 771 : 800}
                    sizes="(max-width: 640px) 165px, 240px"
                    alt=""
                />
            ) : (
                <div className={styles.sigil}>
                    <Code2 size={40} strokeWidth={1.25} />
                </div>
            )}
            <span className={styles.coverLabel}>{isBirthday ? '07 / 11' : isValentine ? '14 / 02' : 'HEARTSCRIPT'}</span>
        </div>
    );
}

const FullscreenOverlay = memo(({ project, onClose }: { project: Project; onClose: () => void }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
            if (event.key === 'F11') event.preventDefault();
        };
        const previousOverflow = document.body.style.overflow;
        window.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = previousOverflow;
        };
    }, [onClose]);

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black animate-in fade-in duration-500 fill-mode-forwards">
            <div className="absolute inset-0 z-0">
                {project.id === 'valentine-3d' ? (
                    <ValentineEntry />
                ) : (
                    <iframe
                        className="w-full h-full border-0 bg-white"
                        srcDoc={project.code}
                        title={project.title}
                        sandbox="allow-scripts allow-modals"
                    />
                )}
            </div>
            <div className="absolute top-6 right-6 z-[10000] flex gap-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="heart-glass-button group flex items-center gap-2 rounded-full px-4 py-2"
                    data-glass-variant="dark"
                >
                    <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">Close</span>
                    <X className="w-5 h-5" aria-hidden="true" />
                </button>
            </div>
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
    const router = useRouter();
    const { user } = useAuthStore();
    const { data: projects, loading, error } = useCollection<Project>('projects', projectQuery);
    const sectionRef = useRef<HTMLElement>(null);
    const shareTriggerRef = useRef<HTMLButtonElement>(null);
    const manualLinkRef = useRef<HTMLInputElement>(null);
    const [entered, setEntered] = useState(false);
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [activeFullscreenProject, setActiveFullscreenProject] = useState<Project | null>(null);
    const [scheduleProject, setScheduleProject] = useState<Project | null>(null);
    const [unlockDateTime, setUnlockDateTime] = useState('');
    const [manualShare, setManualShare] = useState<{ title: string; url: string } | null>(null);
    const [copiedProjectId, setCopiedProjectId] = useState<string | null>(null);
    const [actionError, setActionError] = useState('');
    const closeFullscreen = useCallback(() => setActiveFullscreenProject(null), []);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setEntered(true);
                observer.disconnect();
            }
        }, { threshold: 0.5 });
        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const interval = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!copiedProjectId) return;
        const timeout = window.setTimeout(() => setCopiedProjectId(null), 3_000);
        return () => window.clearTimeout(timeout);
    }, [copiedProjectId]);

    const isHim = !!user?.email && HIM_EMAILS.includes(user.email);
    const configuredProjects = new Map(BUILTIN_PROJECTS.map(project => [project.id, project]));
    for (const project of [...projects].reverse()) {
        const defaults = configuredProjects.get(project.id);
        configuredProjects.set(project.id, defaults ? {
            ...defaults,
            ...project,
            title: project.title || defaults.title,
            description: project.description || defaults.description,
        } : project);
    }
    const visibleProjects = [...configuredProjects.values()].filter(project => isHim || project.isVisibleToHer);

    const openProject = (project: Project) => {
        if (project.id === birthdayProject.id) {
            router.push(projectPath(project.id));
        } else {
            setActiveFullscreenProject(project);
        }
    };

    const openInWindow = (project: Project) => {
        const width = Math.min(window.screen.width * 0.9, 1600);
        const height = Math.min(window.screen.height * 0.9, 900);
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        window.open(
            projectPath(project.id),
            `MiniProject_${project.id}`,
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        )?.focus();
    };

    const shareProject = async (project: Project, trigger: HTMLButtonElement) => {
        shareTriggerRef.current = trigger;
        const url = new URL(projectPath(project.id), window.location.origin).href;
        const shareData = { title: project.title, url };

        try {
            if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
                await navigator.share(shareData);
                return;
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return;
        }

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                setCopiedProjectId(project.id);
                return;
            }
        } catch {
            // The link remains selectable if the browser denies clipboard access.
        }

        setManualShare(shareData);
    };

    const saveSchedule = async (id: string, unlockDate: number | null) => {
        setActionError('');
        try {
            await update(ref(rtdb, `projects/${id}`), { unlockDate });
            setScheduleProject(null);
        } catch (error) {
            console.error('Schedule failed:', error);
            setActionError('Chưa lưu được lịch mở. Thử lại nhé.');
        }
    };

    const toggleVisibility = async (project: Project) => {
        setActionError('');
        try {
            await update(ref(rtdb, `projects/${project.id}`), { isVisibleToHer: !project.isVisibleToHer });
        } catch (error) {
            console.error('Visibility update failed:', error);
            setActionError('Chưa cập nhật được trạng thái hiển thị. Thử lại nhé.');
        }
    };

    const deleteProject = async (project: Project) => {
        if (!window.confirm(`Xóa dự án “${project.title}”?`)) return;
        setActionError('');
        try {
            await remove(ref(rtdb, `projects/${project.id}`));
        } catch (error) {
            console.error('Project deletion failed:', error);
            setActionError('Chưa xóa được dự án. Thử lại nhé.');
        }
    };

    return (
        <section className={styles.studio} ref={sectionRef} data-entered={entered} aria-labelledby="projects-heading">
            <div className={styles.scrollArea}>
                <div className={styles.inner}>
                    <header className={styles.header}>
                        <h2 id="projects-heading">{isHim ? 'Control Center' : 'Our Creations'}</h2>
                    </header>

                    {actionError && <p className={styles.error} role="alert">{actionError}</p>}
                    {error && <p className={styles.error} role="status">Chưa tải được cấu hình dự án.</p>}

                    {loading ? (
                        <div className={styles.empty} role="status"><Loader2 className={styles.spinner} size={22} /> Đang tải dự án…</div>
                    ) : visibleProjects.length === 0 ? (
                        <div className={styles.empty}><Code2 size={25} aria-hidden="true" /> Chưa có dự án nào để xem.</div>
                    ) : (
                        <div className={styles.cards}>
                            {visibleProjects.map(project => {
                                const isBirthday = project.id === birthdayProject.id;
                                const unlockDate = project.unlockDate;
                                const unlockTime = typeof unlockDate === 'number'
                                    ? unlockDate
                                    : unlockDate ? unlockDate.seconds * 1000 : null;
                                const isLocked = !isBirthday && unlockTime !== null && unlockTime > currentTime;
                                const isCopied = copiedProjectId === project.id;
                                const status = isLocked ? 'scheduled' : project.isVisibleToHer ? 'visible' : 'hidden';
                                const { label: statusLabel, icon: StatusIcon } = projectStatuses[status];

                                return (
                                    <article className={`heart-glass-surface heart-glass-crystal ${styles.card}`} key={project.id}>
                                        <ProjectCover project={project} />
                                        {(isHim || isLocked) && (
                                            <span className={styles.badge} data-status={status}>
                                                <StatusIcon size={14} strokeWidth={1.75} aria-hidden="true" />
                                                {statusLabel}
                                            </span>
                                        )}
                                        <div className={styles.cardBody}>
                                            <h3>{project.title}</h3>
                                            <p>{isLocked && !isHim ? `Mở vào ${scheduleFormat.format(unlockTime)}` : project.description}</p>
                                            {(isHim || !isLocked) && (
                                                <div className={styles.actions}>
                                                    <button type="button" className={`heart-glass-button ${styles.openButton}`} data-glass-variant="primary" onClick={() => openProject(project)}>
                                                        {isBirthday ? 'Mở quà' : 'Mở dự án'}
                                                        <span className={styles.launchIcon} aria-hidden="true"><ArrowUpRight size={16} /></span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`heart-glass-button ${styles.shareButton}`}
                                                        aria-label={`Chia sẻ ${project.title}`}
                                                        onClick={event => void shareProject(project, event.currentTarget)}
                                                        disabled={isLocked}
                                                        title={isLocked ? 'Có thể chia sẻ khi dự án đã mở' : undefined}
                                                    >
                                                        {isCopied ? <Check size={16} strokeWidth={1.85} aria-hidden="true" /> : <Share2 size={16} strokeWidth={1.85} aria-hidden="true" />}
                                                        {isCopied ? 'Đã chép' : 'Chia sẻ'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`heart-glass-button ${styles.iconButton}`}
                                                        onClick={() => openInWindow(project)}
                                                        aria-label={`Mở ${project.title} trong cửa sổ mới`}
                                                        title="Mở cửa sổ mới"
                                                    >
                                                        <ExternalLink size={16} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {isHim && (
                                            <footer className={styles.management}>
                                                <span>Quản lý</span>
                                                <div>
                                                    {!isBirthday && (
                                                        <button
                                                            type="button"
                                                            className={`heart-glass-button ${styles.iconButton}`}
                                                            data-glass-variant="quiet"
                                                            aria-label={unlockTime ? `Bỏ lịch mở ${project.title}` : `Hẹn lịch mở ${project.title}`}
                                                            title={unlockTime ? 'Bỏ lịch mở' : 'Hẹn lịch mở'}
                                                            onClick={() => {
                                                                if (unlockTime) {
                                                                    void saveSchedule(project.id, null);
                                                                } else {
                                                                    setActionError('');
                                                                    setUnlockDateTime('');
                                                                    setScheduleProject(project);
                                                                }
                                                            }}
                                                        >
                                                            {unlockTime ? <Unlock size={16} aria-hidden="true" /> : <Clock3 size={16} aria-hidden="true" />}
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className={`heart-glass-button ${styles.iconButton}`}
                                                        data-glass-variant="quiet"
                                                        onClick={() => void toggleVisibility(project)}
                                                        aria-label={project.isVisibleToHer ? `Ẩn ${project.title}` : `Hiện ${project.title}`}
                                                        title={project.isVisibleToHer ? 'Ẩn khỏi bộ sưu tập' : 'Hiện trong bộ sưu tập'}
                                                    >
                                                        {project.isVisibleToHer ? <Eye size={17} aria-hidden="true" /> : <EyeOff size={17} aria-hidden="true" />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`heart-glass-button ${styles.iconButton}`}
                                                        data-glass-variant="quiet"
                                                        data-danger="true"
                                                        onClick={() => void deleteProject(project)}
                                                        aria-label={`Xóa ${project.title}`}
                                                        title="Xóa dự án"
                                                    >
                                                        <Trash2 size={16} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </footer>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                    <span className="sr-only" role="status">{copiedProjectId ? 'Đã sao chép liên kết dự án.' : ''}</span>
                </div>
            </div>

            {activeFullscreenProject && <FullscreenOverlay project={activeFullscreenProject} onClose={closeFullscreen} />}

            <Dialog open={!!manualShare} onOpenChange={open => { if (!open) setManualShare(null); }}>
                <DialogContent
                    className={`heart-glass-surface ${styles.dialog}`}
                    onCloseAutoFocus={event => {
                        event.preventDefault();
                        shareTriggerRef.current?.focus();
                    }}
                >
                    <DialogHeader className={styles.dialogHeader}>
                        <DialogTitle className={styles.dialogTitle}>Chia sẻ dự án</DialogTitle>
                        <DialogDescription className={styles.dialogDescription}>
                            {manualShare?.title} · Chọn liên kết rồi sao chép bằng trình duyệt.
                        </DialogDescription>
                    </DialogHeader>
                    <input
                        className={styles.field}
                        ref={manualLinkRef}
                        type="text"
                        aria-label="Liên kết dự án"
                        value={manualShare?.url ?? ''}
                        readOnly
                        onFocus={event => event.currentTarget.select()}
                        onClick={event => event.currentTarget.select()}
                    />
                    <div className={styles.dialogActions}>
                        <button
                            type="button"
                            className={`heart-glass-button ${styles.shareButton}`}
                            onClick={() => {
                                const field = manualLinkRef.current;
                                field?.focus();
                                field?.select();
                            }}
                        >
                            Chọn liên kết
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!scheduleProject} onOpenChange={open => { if (!open) setScheduleProject(null); }}>
                <DialogContent className={`heart-glass-surface ${styles.dialog}`}>
                    <DialogHeader className={styles.dialogHeader}>
                        <DialogTitle className={styles.dialogTitle}>Hẹn lịch mở</DialogTitle>
                        <DialogDescription className={styles.dialogDescription}>{scheduleProject?.title}</DialogDescription>
                    </DialogHeader>
                    <form
                        className={styles.scheduleForm}
                        onSubmit={event => {
                            event.preventDefault();
                            if (!scheduleProject) return;
                            const timestamp = unlockDateTime ? new Date(unlockDateTime).getTime() : null;
                            if (timestamp !== null && !Number.isFinite(timestamp)) return;
                            void saveSchedule(scheduleProject.id, timestamp);
                        }}
                    >
                        <label htmlFor="project-unlock-date">Ngày và giờ mở</label>
                        <input
                            id="project-unlock-date"
                            className={styles.field}
                            type="datetime-local"
                            value={unlockDateTime}
                            onChange={event => setUnlockDateTime(event.target.value)}
                            min={toDateTimeInputValue(currentTime)}
                        />
                        <p className={styles.dialogDescription}>Để trống nếu muốn mở ngay.</p>
                        {actionError && <p className={styles.error} role="alert">{actionError}</p>}
                        <div className={styles.dialogActions}>
                            <button type="button" className={`heart-glass-button ${styles.shareButton}`} onClick={() => setScheduleProject(null)}>Hủy</button>
                            <button type="submit" className={`heart-glass-button ${styles.openButton}`} data-glass-variant="primary">Lưu lịch</button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </section>
    );
}
