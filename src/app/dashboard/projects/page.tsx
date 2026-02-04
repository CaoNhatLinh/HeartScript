'use client';

import { addDoc, collection, deleteDoc, doc, orderBy, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { Plus, Trash2, Code, Box, Wand2, Lock, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestoreCollection } from '@/hooks/useCollection';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ProjectsPage() {
    const { user } = useAuthStore();
    const router = useRouter();

    const { data: projects, loading } = useFirestoreCollection<Project>('projects', [
        orderBy('createdAt', 'desc')
    ]);

    const [unlockDate, setUnlockDate] = useState<string>('');

    const createProject = async () => {
        const unlockTimestamp = unlockDate ? Timestamp.fromDate(new Date(unlockDate)) : null;

        if (!confirm('Start a new creative project?')) return;

        try {
            const docRef = await addDoc(collection(db, 'projects'), {
                title: 'New Love Project',
                description: 'A magical place for code',
                code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; background: #FFF0F5; color: #DB7093; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }
    h1 { animation: heartbeat 1.5s infinite; }
    @keyframes heartbeat {
      0% { transform: scale(1); }
      25% { transform: scale(1.1); }
      50% { transform: scale(1); }
      75% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
  </style>
</head>
<body>
  <h1>Hello, My Love! 💖</h1>
</body>
</html>`,
                type: 'html',
                createdAt: Timestamp.now(),
                unlockDate: unlockTimestamp,
                userId: user?.uid
            });
            router.push(`/dashboard/projects/${docRef.id}`);
            setUnlockDate(''); // Reset
        } catch (error) {
            console.error("Error creating project:", error);
            alert('Failed to create project');
        }
    };

    const deleteProject = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Delete this project?')) return;
        await deleteDoc(doc(db, 'projects', id));
    };

    const setSchedule = async (projectId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const unlockDateStr = prompt('Enter new unlock date (YYYY-MM-DD HH:MM, leave empty to unlock now):');
        const unlockDate = unlockDateStr ? Timestamp.fromDate(new Date(unlockDateStr)) : null;

        try {
            await updateDoc(doc(db, 'projects', projectId), { unlockDate });
            alert('Schedule updated!');
        } catch (error) {
            console.error("Error updating schedule:", error);
            alert('Failed to update schedule');
        }
    };

    return (
        <div className="space-y-8 min-h-[80vh]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center md:justify-start gap-3">
                        <Wand2 className="w-8 h-8 text-indigo-500" />
                        Creative Space
                    </h1>
                    <p className="text-muted-foreground mt-1 text-center md:text-left">Build little wishes and surprises with code.</p>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Unlock Date (optional)</label>
                    <Input
                        type="datetime-local"
                        value={unlockDate}
                        onChange={(e) => setUnlockDate(e.target.value)}
                        className="w-full md:w-64"
                        placeholder="Set unlock date"
                    />
                </div>
                <Button
                    onClick={createProject}
                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 text-white rounded-full px-6"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/50 border border-dashed border-indigo-100 rounded-3xl">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                        <Code className="w-10 h-10 text-indigo-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700">No projects yet</h3>
                    <p className="text-gray-400 mb-6">Start coding something special for us.</p>
                    <Button variant="outline" onClick={createProject}>Create First Project</Button>
                </div>
            ) : (
                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {projects.map((project, index) => {
                        const isUnlocked = !project.unlockDate || new Date() >= (typeof project.unlockDate === 'number' ? new Date(project.unlockDate) : project.unlockDate.toDate());
                        return (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {isUnlocked ? (
                                    <Card className="group h-full border-border/50 bg-white overflow-hidden relative">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-purple-400" />
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                                                    <Box className="w-6 h-6" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => setSchedule(project.id, e)}
                                                        className="text-gray-300 hover:text-indigo-500 hover:bg-indigo-50"
                                                    >
                                                        <Clock className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => deleteProject(project.id, e)}
                                                        className="text-gray-300 hover:text-red-500 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-lg text-gray-800 mb-2 truncate">{project.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4">
                                                {project.description}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {project.type}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Card className="h-full border-border/50 bg-gray-50 overflow-hidden relative opacity-75">
                                        <div className="absolute inset-0 bg-gray-900/10 flex items-center justify-center">
                                            <div className="text-center">
                                                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">Unlocks on</p>
                                                <p className="text-sm font-medium text-gray-600">{typeof project.unlockDate === 'number' ? new Date(project.unlockDate).toLocaleDateString() : project.unlockDate?.toDate().toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <CardContent className="p-6">
                                            <h3 className="font-bold text-lg text-gray-600 mb-2 truncate">{project.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4">
                                                {project.description}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {project.type}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => setSchedule(project.id, e)}
                                                    className="text-gray-500 hover:text-indigo-500"
                                                >
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    Set Schedule
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}
