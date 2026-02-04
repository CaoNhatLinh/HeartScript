'use client';

import ValentineEntry from '@/components/love-journey/miniprojects/valentine/ValentineEntry';
import { rtdb } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import React, { useEffect, useState, use } from 'react';
import { Loader2, FileQuestion } from 'lucide-react';
import { Project } from '@/types';

type Props = {
    params: Promise<{ id: string }>
}

export default function MiniProjectPage({ params }: Props) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id === 'valentine-3d') {
            setLoading(false);
            return;
        }

        const fetchProject = async () => {
            try {
                const snapshot = await get(ref(rtdb, `projects/${id}`));
                if (snapshot.exists()) {
                    setProject({ id, ...snapshot.val() });
                }
            } catch (error) {
                console.error("Error fetching project:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [id]);

    if (id === 'valentine-3d') {
        return <ValentineEntry />;
    }

    if (loading) {
        return (
            <div
                className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-white gap-4"
                suppressHydrationWarning
            >
                <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
                <p className="font-mono text-zinc-400 animate-pulse">Loading Module...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-white gap-6">
                <div className="p-6 rounded-full bg-zinc-900 border border-zinc-800">
                    <FileQuestion className="w-12 h-12 text-zinc-500" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-mono font-bold text-zinc-200">System Error: 404</h1>
                    <p className="text-zinc-500 font-mono">Module not found in database.</p>
                    <p className="text-xs text-zinc-700 font-mono pt-4">ID: {id}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-black overflow-hidden">
            <iframe
                className="w-full h-full border-0 bg-white"
                srcDoc={project.code}
                title={project.title}
                sandbox="allow-scripts allow-modals"
            />
        </div>
    );
}
