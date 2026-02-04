'use client';

import { useCollection } from '@/hooks/useCollection';
import { Project } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { Code as CodeIcon, Terminal, Plus, ExternalLink, Wand2, Eye, EyeOff, Play, Trash2, PenLine, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { push, ref, set, update, remove, query, orderByChild } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { useState } from 'react';
import { HIM_EMAILS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Editor from '@monaco-editor/react';
import ValentineEntry from '../miniprojects/valentine/ValentineEntry';

export function ProjectsSection() {
    const { user } = useAuthStore();
    const { data: projects, loading } = useCollection<Project>('projects', (qRef) =>
        query(qRef, orderByChild('createdAt'))
    );
    // Newest projects first
    const dbProjects = [...projects].reverse();

    // Virtual special projects
    const specialProjects: Project[] = [
        {
            id: 'valentine-3d',
            title: 'Valentine 3D Room',
            description: 'A magical 3D world with roses, floating memories and interactive gifts.',
            code: '',
            type: 'react',
            isVisibleToHer: true,
            createdAt: 1707868800000, // Feb 14, 2024 (approx)
            userId: 'system'
        }
    ];

    const displayedProjects = [...specialProjects, ...dbProjects];
    const [runningProject, setRunningProject] = useState<Project | null>(null);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editorCode, setEditorCode] = useState('');

    const isHim = user?.email && HIM_EMAILS.includes(user.email);

    const handleCreate = async () => {
        if (!user) return;
        const newRef = push(ref(rtdb, 'projects'));
        await set(newRef, {
            title: 'New Love Spell',
            description: 'A magical interaction for us.',
            code: `
<style>
  body { 
    margin: 0; 
    height: 100vh; 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    background: #000; 
    overflow: hidden;
  }
  .heart {
    position: relative;
    width: 100px;
    height: 90px;
    animation: beat 1s infinite alternate;
  }
  .heart::before, .heart::after {
    content: "";
    position: absolute;
    left: 50px;
    top: 0;
    width: 50px;
    height: 80px;
    background: #ff4d6d;
    border-radius: 50px 50px 0 0;
    transform: rotate(-45deg);
    transform-origin: 0 100%;
  }
  .heart::after {
    left: 0;
    transform: rotate(45deg);
    transform-origin: 100% 100%;
  }
  @keyframes beat {
    to { transform: scale(1.2); }
  }
</style>
<div class="heart"></div>
             `,
            type: 'html',
            isVisibleToHer: false,
            createdAt: Date.now(),
            userId: user.uid
        });
    };

    const toggleVisibility = async (project: Project) => {
        if (!project.id) return;
        await update(ref(rtdb, `projects/${project.id}`), {
            isVisibleToHer: !project.isVisibleToHer
        });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this project?')) {
            await remove(ref(rtdb, `projects/${id}`));
        }
    };

    const openEditor = (project: Project) => {
        setEditingProject(project);
        setEditorCode(project.code || '');
    };

    const handleSaveCode = async () => {
        if (!editingProject?.id) return;

        await update(ref(rtdb, `projects/${editingProject.id}`), {
            code: editorCode,
        });
        setEditingProject(null);
    };

    // Filter projects for display
    const visibleProjects = isHim
        ? displayedProjects
        : displayedProjects.filter(p => p.isVisibleToHer);

    return (
        <section className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 snap-start shrink-0 relative border-l border-zinc-800">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-zinc-950 pointer-events-none" />

            <div className="z-10 w-full max-w-6xl p-8 h-full flex flex-col justify-center">
                <div className="flex justify-between items-center mb-8">
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

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="text-zinc-600 font-mono">Loading modules...</div>
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

                                return isHim ? (
                                    // HIM VIEW (Admin List)
                                    <div key={project.id} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-lg flex items-center justify-between group hover:border-indigo-500/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-2 h-2 rounded-full", project.isVisibleToHer ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-orange-500")} />
                                            <div>
                                                <h3 className="font-mono text-zinc-200 font-bold">{project.title}</h3>
                                                <p className="text-xs text-zinc-500 truncate max-w-[300px]">{project.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => openEditor(project)}
                                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                                title="Edit Code"
                                            >
                                                <PenLine className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setRunningProject(project)}
                                                className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20"
                                                title="Run Preview"
                                            >
                                                <Play className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => toggleVisibility(project)}
                                                className={cn(project.isVisibleToHer ? "text-green-500 hover:text-green-400" : "text-zinc-500 hover:text-zinc-400")}
                                                title="Toggle Visibility"
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
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br text-white shadow-lg", gradient)}>
                                                        <Wand2 className="w-5 h-5" />
                                                    </div>
                                                    <span className="px-2 py-1 rounded-full text-[10px] font-bold tracking-widest bg-white/5 text-white/50 border border-white/10">MAGIC</span>
                                                </div>

                                                <h3 className="text-xl font-bold text-white mb-2 font-sans tracking-tight">{project.title}</h3>
                                                <p className="text-zinc-400 text-sm leading-relaxed mb-6 line-clamp-3">{project.description}</p>
                                            </div>

                                            <Button
                                                onClick={() => setRunningProject(project)}
                                                className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all font-medium text-xs group/btn relative overflow-hidden"
                                            >
                                                <span className="relative z-10 flex items-center justify-center">
                                                    Open Experience <Play className="w-3 h-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                                </span>
                                                <div className={cn("absolute inset-0 bg-gradient-to-r opacity-0 group-hover/btn:opacity-20 transition-opacity", gradient)} />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* EDITOR SHEET */}
            <Sheet open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
                <SheetContent side="bottom" className="h-[90vh] bg-zinc-950 border-zinc-800 p-0 flex flex-col">
                    <SheetHeader className="px-6 py-4 border-b border-zinc-800 flex flex-row items-center justify-between">
                        <SheetTitle className="text-zinc-200 font-mono flex items-center gap-2">
                            <CodeIcon className="w-4 h-4 text-blue-400" />
                            Editing: {editingProject?.title}
                        </SheetTitle>
                        <Button size="sm" onClick={handleSaveCode} className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono">
                            <Save className="w-4 h-4 mr-2" /> Save Changes
                        </Button>
                    </SheetHeader>
                    <div className="flex-1 w-full bg-[#1e1e1e]">
                        <Editor
                            height="100%"
                            defaultLanguage="html"
                            value={editorCode}
                            theme="vs-dark"
                            onChange={(value) => setEditorCode(value || '')}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                wordWrap: 'on',
                                automaticLayout: true
                            }}
                        />
                    </div>
                </SheetContent>
            </Sheet>

            {/* PREVIEW DIALOG */}
            <Dialog open={!!runningProject} onOpenChange={(open) => !open && setRunningProject(null)}>
                <DialogContent className="max-w-4xl h-[80vh] bg-zinc-950 border-zinc-800 flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-4 border-b border-zinc-800 bg-zinc-900">
                        <DialogTitle className="font-mono text-zinc-200 flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-green-500" />
                            Running: {runningProject?.title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 bg-black w-full h-full relative">
                        {runningProject?.id === 'valentine-3d' ? (
                            <ValentineEntry />
                        ) : runningProject && (
                            <iframe
                                className="w-full h-full border-0 bg-white"
                                srcDoc={runningProject.code}
                                title="Project Preview"
                                sandbox="allow-scripts allow-modals"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
}
