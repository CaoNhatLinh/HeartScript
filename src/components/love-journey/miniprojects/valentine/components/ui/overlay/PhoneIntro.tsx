"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, Camera, Flashlight, ChevronLeft, Phone, Video,
    MoreHorizontal, Send, Heart, Smile, Image as ImageIcon,
    Mic, Plus, Gift
} from 'lucide-react';
import { useExperienceStore } from '../../../store/useExperienceStore';

/**
 * PhoneIntro - A magical iPhone mockup intro sequence
 */
export const PhoneIntro: React.FC = () => {
    const { introPhase, setIntroPhase, valentinePhotos, setScene, setIsIntroStarting } = useExperienceStore();
    const [passcode, setPasscode] = useState('');
    const [chatStep, setChatStep] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isExiting, setIsExiting] = useState(false);

    const wallpaper = valentinePhotos.length > 0 ? valentinePhotos[0] : 'https://images.unsplash.com/photo-1518568814520-5312f1d2486c?q=80&w=1000&auto=format&fit=crop';

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const messages = [
        "hello bé iu",
        "hôm nay là valentine ấy",
        "anh xin lỗi vì valentine năm nay a không bên cạnh em được",
        "em đừng buồn nhé",
        "anh có một chút bất ngờ dành cho em nè ❤️"
    ];

    // Auto-advance chat
    useEffect(() => {
        if (introPhase === 'phone-chat' && chatStep < messages.length) {
            const timer = setTimeout(() => {
                setChatStep(prev => prev + 1);
            }, 1500 + Math.random() * 1000);
            return () => clearTimeout(timer);
        } else if (introPhase === 'phone-chat' && chatStep === messages.length) {
            setTimeout(() => setIntroPhase('phone-gift'), 1000);
        }
    }, [introPhase, chatStep, messages.length, setIntroPhase]);

    if (introPhase === 'none' || introPhase === 'completed') return null;

    const handleKeyClick = (num: string) => {
        if (passcode.length < 4) {
            const newPasscode = passcode + num;
            setPasscode(newPasscode);
            if (newPasscode === '0711') {
                setTimeout(() => setIntroPhase('phone-chat'), 500);
            } else if (newPasscode.length === 4) {
                // Shake effect on wrong passcode
                setTimeout(() => setPasscode(''), 500);
            }
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4 font-sans"
            >
                {/* iPhone Mockup Frame */}
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={isExiting ? {
                        scale: 5,
                        y: 0,
                        opacity: 0,
                        filter: 'blur(20px)'
                    } : {
                        scale: 1,
                        y: 0
                    }}
                    transition={isExiting ? {
                        duration: 1.2,
                        ease: [0.4, 0, 0.2, 1]
                    } : {
                        type: 'spring',
                        damping: 20
                    }}
                    className="relative w-full max-w-[380px] h-[780px] bg-[#1a1a1a] rounded-[60px] border-[12px] border-[#1a1a1a] shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                    {/* Dynamic Island */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-b-[20px] z-[100] flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-[#1a1a1a] absolute left-4" />
                    </div>

                    {/* LOCK SCREEN */}
                    {introPhase === 'phone-lock' && (
                        <motion.div
                            key="lock"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="absolute inset-0 z-10"
                        >
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s]"
                                style={{
                                    backgroundImage: `url(${wallpaper})`,
                                    filter: 'brightness(0.85)'
                                }}
                            />

                            {/* Time & Date */}
                            <div className="absolute top-24 left-0 right-0 text-center text-white select-none">
                                <motion.h1
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="text-8xl font-medium tracking-tight"
                                >
                                    {currentTime.getHours().toString().padStart(2, '0')}:
                                    {currentTime.getMinutes().toString().padStart(2, '0')}
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-xl font-light mt-1"
                                >
                                    {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </motion.p>
                            </div>

                            {/* Notification */}
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                onClick={() => setIntroPhase('phone-passcode')}
                                className="absolute bottom-40 left-4 right-4 bg-white/10 backdrop-blur-xl rounded-[28px] p-4 border border-white/20 shadow-2xl cursor-pointer pointer-events-auto"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                                        <Bell size={20} className="text-white fill-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-white font-semibold text-sm">Anh iu ❤️</span>
                                            <span className="text-white/50 text-xs">bây giờ</span>
                                        </div>
                                        <p className="text-white/90 text-[13px]">hello bé iu</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Bottom Controls */}
                            <div className="absolute bottom-12 left-8 right-8 flex justify-between">
                                <button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                                    <Flashlight size={20} />
                                </button>
                                <button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                                    <Camera size={20} />
                                </button>
                            </div>

                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/30 rounded-full" />
                        </motion.div>
                    )}

                    {/* PASSCODE SCREEN */}
                    {introPhase === 'phone-passcode' && (
                        <motion.div
                            key="passcode"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 z-20 bg-cover bg-center"
                            style={{ backgroundImage: `url(${wallpaper})` }}
                        >
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl flex flex-col items-center pt-32">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex gap-8 mb-4"
                                >
                                    <Heart size={40} className="text-rose-400 fill-rose-400 animate-bounce" />
                                    <Heart size={40} className="text-rose-400 fill-rose-400 animate-bounce delay-100" />
                                </motion.div>

                                <h2 className="text-white text-xl font-medium mb-1">Nhập mật mã tình yêu</h2>
                                <p className="text-white/50 text-sm mb-12">mật khẩu là: 0000</p>

                                <div className="flex gap-4 mb-20">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className={`w-3.5 h-3.5 rounded-full border border-white/50 transition-all duration-300 ${passcode.length > i ? 'bg-white scale-110' : ''}`}
                                        />
                                    ))}
                                </div>

                                <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''].map((val, i) => (
                                        val ? (
                                            <motion.button
                                                key={i}
                                                whileTap={{ scale: 0.9, backgroundColor: 'rgba(255,255,255,0.4)' }}
                                                onClick={() => handleKeyClick(val)}
                                                className="w-18 h-18 rounded-full bg-white/10 text-white text-3xl font-light flex flex-col items-center justify-center border border-white/5"
                                            >
                                                {val}
                                            </motion.button>
                                        ) : <div key={i} />
                                    ))}
                                </div>

                                <button
                                    onClick={() => {
                                        setPasscode('');
                                        setIntroPhase('phone-lock');
                                    }}
                                    className="mt-12 text-white/80 hover:text-white transition-colors"
                                >
                                    Hủy
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* CHAT SCREEN */}
                    {(introPhase === 'phone-chat' || introPhase === 'phone-gift') && (
                        <motion.div
                            key="chat"
                            initial={{ x: 300 }}
                            animate={{ x: 0 }}
                            className="absolute inset-0 z-30 bg-[#FCE4EC] flex flex-col"
                        >
                            {/* Chat Header */}
                            <div className="pt-14 pb-3 px-4 bg-white/90 backdrop-blur-md border-b border-rose-100 flex items-center justify-between sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <ChevronLeft size={24} className="text-rose-500" />
                                    <div className="w-10 h-10 rounded-full bg-rose-200 overflow-hidden border-2 border-white shadow-sm">
                                        <img src={wallpaper} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800 leading-tight">Anh iu ❤️</h3>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            <span className="text-[10px] text-gray-400">Đang hoạt động</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-rose-500">
                                    <Phone size={20} />
                                    <Video size={22} />
                                    <MoreHorizontal size={22} />
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-gradient-to-b from-rose-50 to-white">
                                <AnimatePresence>
                                    {messages.slice(0, chatStep).map((msg, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            className="self-start max-w-[80%] bg-white rounded-2xl rounded-tl-none p-3 shadow-sm border border-rose-50 text-gray-700 text-[14px] leading-relaxed relative"
                                        >
                                            {msg}
                                            {i === 4 && <Heart size={10} className="absolute -bottom-1 -right-1 text-rose-400 fill-rose-400" />}
                                        </motion.div>
                                    ))}
                                    {chatStep < messages.length && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="self-start bg-white/60 rounded-full px-4 py-2 flex gap-1"
                                        >
                                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* GIFT REVEAL */}
                                {introPhase === 'phone-gift' && (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                            setIsExiting(true);
                                            setIsIntroStarting(true);
                                            setTimeout(() => {
                                                setIntroPhase('completed');
                                                setScene('intro');
                                            }, 1000);
                                        }}
                                        className="self-center mt-8 cursor-pointer flex flex-col items-center gap-3 pointer-events-auto"
                                    >
                                        <div className="w-20 h-20 bg-rose-500 rounded-3xl flex items-center justify-center shadow-[0_10px_30px_rgba(244,67,54,0.4)] animate-bounce">
                                            <Gift size={40} className="text-white" />
                                        </div>
                                        <span className="text-rose-500 font-bold text-sm animate-pulse">Chạm để mở quà!</span>
                                    </motion.div>
                                )}
                            </div>

                            {/* Input Bar */}
                            <div className="p-4 bg-white border-t border-rose-50 flex items-center gap-3">
                                <Plus size={20} className="text-rose-400" />
                                <ImageIcon size={20} className="text-rose-400" />
                                <Mic size={20} className="text-rose-400" />
                                <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-400 flex justify-between items-center">
                                    <span>Nhắn tin...</span>
                                    <Smile size={18} />
                                </div>
                                <Send size={20} className="text-rose-500" />
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
