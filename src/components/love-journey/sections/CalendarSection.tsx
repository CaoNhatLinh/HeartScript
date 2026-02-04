'use client';

import { useCollection } from '@/hooks/useCollection';
import { CalendarEvent } from '@/types';
import { push, ref, set, query, orderByChild } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { Calendar } from '@/components/ui/calendar';
import {
    CalendarHeart,
    Plus,
    ChevronRight,
    MapPin,
    Clock,
    Star,
    Sparkles,
    Heart,
    ArrowRight,
    Loader2,
    Trash2,
    Edit2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { remove } from 'firebase/database';

export function CalendarSection() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const { data: events, loading } = useCollection<CalendarEvent>('events', (qRef) =>
        query(qRef, orderByChild('date'))
    );

    const [isAdding, setIsAdding] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newType, setNewType] = useState<'date' | 'anniversary'>('date');
    const [submitting, setSubmitting] = useState(false);

    const getEventsForDay = (day: Date) => {
        return events.filter((e: CalendarEvent) => {
            const eDate = new Date(e.date as unknown as number);
            return eDate.getDate() === day.getDate() &&
                eDate.getMonth() === day.getMonth() &&
                eDate.getFullYear() === day.getFullYear();
        });
    };

    const handleOpenEdit = (event: CalendarEvent) => {
        setEditingEvent(event);
        setNewTitle(event.title);
        setNewType(event.type as 'date' | 'anniversary');
        setIsAdding(true);
    };

    const handleAddEvent = async () => {
        if (!newTitle || !selectedDate) return;
        setSubmitting(true);
        try {
            if (editingEvent) {
                // Update existing
                await set(ref(rtdb, `events/${editingEvent.id}`), {
                    title: newTitle,
                    date: editingEvent.date,
                    type: newType
                });
            } else {
                // Push new
                const newEventRef = push(ref(rtdb, 'events'));
                await set(newEventRef, {
                    title: newTitle,
                    date: selectedDate.getTime(),
                    type: newType
                });
            }
            setNewTitle('');
            setEditingEvent(null);
            setIsAdding(false);
        } catch (error) {
            console.error("Error saving event:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (!window.confirm("Xóa kỷ niệm này? [Icon: AlertTriangle]")) return;
        try {
            await remove(ref(rtdb, `events/${id}`));
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    };

    const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

    return (
        <section className="h-screen w-screen relative overflow-hidden bg-[#faf9f6] snap-start shrink-0 flex items-center justify-center p-6 md:p-12" suppressHydrationWarning>
            {/* Soft Background Accents */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-rose-100/30 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-indigo-100/30 rounded-full blur-[120px]" />
            </div>

            {/* Floating Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 100, x: Math.random() * 100 }}
                        animate={{
                            opacity: [0, 0.6, 0],
                            y: -120,
                            x: Math.random() * 60 - 30,
                            rotate: [0, 20, -20, 0]
                        }}
                        transition={{
                            duration: 12 + Math.random() * 8,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                            ease: "linear"
                        }}
                        className="absolute bottom-0 text-rose-200/60"
                        style={{ left: `${Math.random() * 100}%` }}
                    >
                        {i % 2 === 0 ? <Heart className="w-6 h-6 fill-rose-100" /> : <Sparkles className="w-4 h-4 text-yellow-200" />}
                    </motion.div>
                ))}
            </div>

            <div className="relative z-10 w-full max-w-7xl h-full flex flex-col md:flex-row gap-8 items-stretch overflow-hidden">

                {/* 1. Milestones Info (1/4) */}
                <div className="hidden md:flex flex-col justify-center space-y-8 w-1/4">
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 border border-rose-100/50 rounded-full text-rose-500 text-[10px] font-black uppercase tracking-[0.2em]"
                        >
                            <CalendarHeart className="w-3 h-3" />
                            Our Journey
                        </motion.div>
                        <h2 className="text-7xl xl:text-8xl font-['Dancing_Script'] font-bold text-stone-800 leading-[0.85] tracking-tight drop-shadow-sm">
                            Sweet <br /><span className="text-rose-500">History</span>
                        </h2>
                        <p className="text-stone-500 text-lg font-['Patrick_Hand'] leading-relaxed max-w-xs pl-1 border-l-2 border-rose-200">
                            Every date is a chapter, every moment is a heart-beat in our shared story...
                        </p>
                    </div>

                    <Dialog open={isAdding} onOpenChange={(open) => {
                        setIsAdding(open);
                        if (!open) {
                            setEditingEvent(null);
                            setNewTitle('');
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="w-fit rounded-2xl bg-stone-900 hover:bg-black text-white font-serif py-7 px-10 shadow-xl transition-all hover:scale-105 active:scale-95 text-lg">
                                <Plus className="w-5 h-5 mr-3" /> Plan a Date
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border-none text-stone-800 sm:max-w-md rounded-[32px] shadow-3xl p-8">
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-serif text-stone-800 flex items-center gap-3 italic mb-4">
                                    <div className="p-3 bg-rose-50 rounded-2xl">
                                        <CalendarHeart className="text-rose-500 w-6 h-6" />
                                    </div>
                                    {editingEvent ? "Edit Our Memory" : "Save a Moment"}
                                </DialogTitle>
                                <DialogDescription className="text-stone-600">
                                    {editingEvent ? "Update the details of this special memory" : "Create a new memory for our calendar"}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-stone-400 font-sans uppercase text-[10px] tracking-[0.2em] font-black">Memory Title</Label>
                                    <Input
                                        placeholder="What's the plan, love?"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        className="bg-stone-50 border-stone-100 focus:border-rose-300 focus:ring-rose-300 rounded-2xl h-14 text-lg font-serif"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-stone-400 font-sans uppercase text-[10px] tracking-[0.2em] font-black">Type of Memory</Label>
                                    <div className="flex gap-3">
                                        <Button
                                            variant={newType === 'date' ? 'default' : 'outline'}
                                            onClick={() => setNewType('date')}
                                            className={cn("flex-1 rounded-2xl h-14 font-serif transition-all",
                                                newType === 'date' ? "bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-100 text-white" : "border-stone-100 text-stone-400 hover:bg-stone-50")}
                                        >
                                            <Star className="w-4 h-4 mr-2" /> Date
                                        </Button>
                                        <Button
                                            variant={newType === 'anniversary' ? 'default' : 'outline'}
                                            onClick={() => setNewType('anniversary')}
                                            className={cn("flex-1 rounded-2xl h-14 font-serif transition-all",
                                                newType === 'anniversary' ? "bg-stone-800 hover:bg-black shadow-lg shadow-stone-200 text-white" : "border-stone-100 text-stone-400 hover:bg-stone-50")}
                                        >
                                            <Heart className="w-4 h-4 mr-2" /> Anniversary
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-4 bg-stone-50 rounded-2xl text-stone-400 italic text-sm font-serif">
                                    Marking: {selectedDate ? format(selectedDate, 'PPP') : 'Selection required'}
                                </div>
                                <Button
                                    onClick={handleAddEvent}
                                    disabled={submitting || !newTitle}
                                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-serif h-16 rounded-2xl text-xl shadow-lg transition-all hover:scale-[1.02]"
                                >
                                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (editingEvent ? "Confirm Changes" : "Confirm Milestone")}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* 2. Premium Calendar Box (Center) */}
                <div className="flex-[1.2] flex flex-col justify-center items-center overflow-hidden h-full px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/80 backdrop-blur-[40px] p-8 lg:p-12 rounded-[50px] shadow-[0_40px_100px_-40px_rgba(0,0,0,0.1)] border border-white relative w-full max-w-[420px] h-fit"
                    >
                        {/* Internal Soft Glow */}
                        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-rose-50/50 to-transparent rounded-t-[50px] pointer-events-none" />

                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="p-0 select-none"
                            classNames={{
                                month: "space-y-8 w-full relative",
                                month_caption: "flex justify-center items-center h-12 mb-6 relative",
                                caption_label: "text-4xl font-['Dancing_Script'] font-bold text-stone-800 tracking-wide",
                                nav: "absolute inset-0 flex items-center justify-between pointer-events-none z-20 px-1", // Container spans full width
                                button_previous: cn(
                                    "h-10 w-10 transition-all rounded-full flex items-center justify-center text-stone-300 hover:text-stone-800 pointer-events-auto",
                                    "hover:bg-white/80 hover:shadow-md active:scale-90 border border-transparent hover:border-stone-100"
                                ),
                                button_next: cn(
                                    "h-10 w-10 transition-all rounded-full flex items-center justify-center text-stone-300 hover:text-stone-800 pointer-events-auto",
                                    "hover:bg-white/80 hover:shadow-md active:scale-90 border border-transparent hover:border-stone-100"
                                ),
                                month_grid: "w-full border-collapse relative z-10",
                                weekdays: "grid grid-cols-7 w-full mb-4",
                                weekday: "text-stone-300 font-serif italic text-[11px] font-bold uppercase tracking-widest text-center",
                                week: "grid grid-cols-7 w-full mt-3",
                                day: "relative p-0 text-center w-full flex items-center justify-center aspect-square",
                                day_button: cn(
                                    "h-11 w-11 p-0 font-serif text-lg transition-all rounded-[18px] text-stone-600 flex items-center justify-center relative group/day",
                                    "hover:bg-rose-50 hover:text-rose-500 hover:scale-105"
                                ),
                                selected: cn(
                                    "bg-stone-900 !text-white shadow-[0_10px_20px_-5px_rgba(28,25,23,0.3)] scale-110 !rounded-[18px] z-20 font-medium",
                                    "hover:bg-stone-900 hover:text-white hover:scale-110", // Force override hover
                                    "after:absolute after:bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-rose-200 after:rounded-full after:shadow-[0_0_8px_rgba(253,224,71,0.5)]"
                                ),
                                today: "text-rose-500 font-bold bg-rose-50/50",
                                outside: "text-stone-200 opacity-0 pointer-events-none", // Hide outside days for cleaner look
                                disabled: "text-stone-100 opacity-20",
                                hidden: "invisible",
                            }}
                            components={{
                                Chevron: (props) => {
                                    if (props.orientation === 'left') return <ChevronRight className="w-5 h-5 rotate-180 stroke-[2.5]" />;
                                    return <ChevronRight className="w-5 h-5 stroke-[2.5]" />;
                                }
                            }}
                            modifiers={{
                                hasEvent: (date) => getEventsForDay(date).length > 0
                            }}
                            modifiersClassNames={{
                                hasEvent: "before:absolute before:top-2 before:right-2 before:w-1.5 before:h-1.5 before:bg-rose-400 before:rounded-full before:animate-pulse"
                            }}
                        />
                    </motion.div>
                </div>

                {/* 3. Agenda Side View (1/3) */}
                <div className="hidden lg:flex flex-col w-1/3 py-8">
                    <div className="bg-white/60 backdrop-blur-3xl rounded-[48px] border border-white/50 flex-1 flex flex-col shadow-2xl shadow-stone-200/50 overflow-hidden">
                        <div className="p-10 border-b border-stone-100/50">
                            <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] mb-4">Milestones</h3>
                            <div className="flex items-baseline justify-between">
                                <h4 className="text-3xl font-serif font-black text-stone-800 tracking-tighter italic">
                                    {selectedDate ? format(selectedDate, 'MMM do') : 'Select Date'}
                                </h4>
                                <span className="text-stone-300 font-serif italic text-sm">
                                    {selectedDate ? format(selectedDate, 'yyyy') : ''}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-4 text-stone-200">
                                    <Loader2 className="w-10 h-10 animate-spin" />
                                    <p className="italic font-serif text-sm">Unlocking memories...</p>
                                </div>
                            ) : selectedDayEvents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center border border-stone-100 transform -rotate-12">
                                        <Sparkles className="w-10 h-10 text-stone-200" />
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-stone-400 italic font-serif text-lg leading-relaxed">No plans yet.<br />Shall we create one?</p>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setIsAdding(true)}
                                            className="text-rose-400 hover:text-rose-500 p-0 h-auto font-black uppercase text-[10px] tracking-[0.25em] hover:bg-transparent transition-all hover:translate-x-1"
                                        >
                                            Surprise Her <ArrowRight className="w-4 h-4 ml-3" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {selectedDayEvents.map((event: CalendarEvent, idx: number) => (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="group relative bg-white/50 hover:bg-white p-7 rounded-[32px] border border-stone-50 transition-all hover:shadow-xl hover:shadow-rose-500/5 hover:-translate-y-1"
                                        >
                                            <div className="flex justify-between items-start mb-5">
                                                <div className={cn(
                                                    "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                                                    event.type === 'anniversary' ? "bg-stone-900 text-white" : "bg-rose-50 text-rose-500"
                                                )}>
                                                    {event.type}
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(event); }}
                                                        className="h-8 w-8 rounded-full text-stone-100 group-hover:text-stone-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                                                        className="h-8 w-8 rounded-full text-stone-100 group-hover:text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <h5 className="text-stone-800 font-serif font-black text-2xl tracking-tighter leading-none mb-4 italic">{event.title}</h5>
                                            <div className="flex items-center gap-6 text-stone-400 text-[11px] font-bold">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5" /> All Day
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-3.5 h-3.5" /> Love City
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Side Section Footer */}
                        <div className="p-10 bg-stone-50/50 border-t border-stone-100/50 flex justify-between items-center">
                            <div className="flex -space-x-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-11 h-11 rounded-full border-[6px] border-white bg-rose-50 flex items-center justify-center shadow-sm">
                                        <Heart className="w-4 h-4 text-rose-300 fill-rose-300" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em]">
                                {events.length} Milestones
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Vertical Exploration Hint */}
            <div className="absolute top-1/2 right-12 -translate-y-1/2 z-50">
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
                    className="group flex items-center gap-8 text-stone-300 hover:text-rose-500 transition-all"
                >
                    <span className="text-[11px] font-black uppercase tracking-[0.5em] [writing-mode:vertical-lr] rotate-180 transition-colors">
                        Discover Magic
                    </span>

                    <div className="flex flex-col items-center gap-5">
                        <div className="w-px h-24 bg-gradient-to-b from-transparent via-stone-200 to-stone-200 group-hover:via-rose-200 transition-all" />
                        <motion.div
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            animate={{ x: [0, 5, 0] }}
                            transition={{ x: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
                            className="p-6 bg-white/60 backdrop-blur-3xl rounded-[28px] border border-white/80 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] group-hover:shadow-rose-100 group-hover:border-rose-100 transition-all"
                        >
                            <ChevronRight className="w-7 h-7 text-stone-400 group-hover:text-rose-500" />
                        </motion.div>
                        <div className="w-px h-24 bg-gradient-to-t from-transparent via-stone-200 to-stone-200 group-hover:via-rose-200 transition-all" />
                    </div>
                </motion.button>
            </div>
        </section>
    );
}
