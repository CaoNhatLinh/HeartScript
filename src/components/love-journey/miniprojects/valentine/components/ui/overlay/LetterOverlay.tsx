import React from 'react';
import { ChevronRight, Heart } from 'lucide-react';
import { useExperienceStore } from '../../../store/useExperienceStore';
import type { FocusTarget } from '../../../store/useExperienceStore';

import { motion } from 'framer-motion';

// --- Typewriter Components ---

// Shared Audio Context to avoid hitting the browser's limit
let sharedAudioCtx: AudioContext | null = null;

const playTypewriterClick = () => {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        if (!sharedAudioCtx) {
            sharedAudioCtx = new AudioContextClass();
        }

        const ctx = sharedAudioCtx as AudioContext;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        // Create a short noise burst for a realistic "tap/click" sound
        const duration = 0.03;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Filter the noise to make it "thumpy" and less "static"
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000 + Math.random() * 500;
        filter.Q.value = 1;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
    } catch {
        // Silent fail
    }
};

const TypewriterText: React.FC<{ text: string; speed?: number; onComplete?: () => void }> = ({ text, speed = 50, onComplete }) => {
    const [wordIndex, setWordIndex] = React.useState(0);
    const words = React.useMemo(() => {
        return text.split(" ").filter(w => w.trim() !== "");
    }, [text]);

    // Use a ref for onComplete
    const onCompleteRef = React.useRef(onComplete);
    React.useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // Reset when text changes
    React.useEffect(() => {
        setWordIndex(0);
    }, [words]);

    React.useEffect(() => {
        const totalWords = words.length;

        if (totalWords === 0) {
            if (onCompleteRef.current) onCompleteRef.current();
            return;
        }

        if (wordIndex >= totalWords) return;

        const interval = setInterval(() => {
            setWordIndex(prev => {
                if (prev >= totalWords) {
                    clearInterval(interval);
                    return prev;
                }
                const next = prev + 1;

                // Play Sound
                playTypewriterClick();

                if (next >= totalWords) {
                    setTimeout(() => onCompleteRef.current?.(), 0);
                }
                return next;
            });
        }, speed);

        return () => clearInterval(interval);
    }, [words, speed, wordIndex]);

    // Construct string from 0 to current index
    const displayedText = words.slice(0, wordIndex).join(" ");

    return (
        <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {displayedText}
            {/* Show cursor only while typing */}
            {wordIndex < words.length && (
                <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    style={{ marginLeft: '2px', color: '#8b0000' }}
                >
                    |
                </motion.span>
            )}
        </motion.span>
    );
};

const TypewriterSequence: React.FC<{ children: (activeStep: number, onStepComplete: (step: number) => void) => React.ReactNode }> = ({ children }) => {
    const [activeStep, setActiveStep] = React.useState(-1); // Start at -1 for initial delay
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        // Initial delay of 1s before showing first paragraph
        const timer = setTimeout(() => {
            setActiveStep(0);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleStepComplete = (step: number) => {
        // Delay slightly before starting next step for natural pause
        setTimeout(() => {
            setActiveStep((prev) => Math.max(prev, step + 1));
        }, 600);
    };

    if (!mounted) return null;

    return <>{children(activeStep, handleStepComplete)}</>;
};

export const LetterOverlay: React.FC = () => {
    const isReading = useExperienceStore((s) => s.isReadingLetter);
    const setReading = useExperienceStore((s) => s.setReadingLetter);
    const hasRead = useExperienceStore((s) => s.hasReadLetter);
    const markRead = useExperienceStore((s) => s.markReadLetter);
    const requestTransition = useExperienceStore((s) => s.requestSceneTransition);
    const setFocusTarget = useExperienceStore((s) => s.setFocusTarget);

    const [isTransitioning, setIsTransitioning] = React.useState(false);
    const previousFocus = React.useRef<FocusTarget | null>(null);

    // Camera focus when letter opens/closes
    React.useEffect(() => {
        if (isReading) {
            previousFocus.current = useExperienceStore.getState().focusTarget;
            setFocusTarget('envelope');
        } else if (previousFocus.current) {
            setFocusTarget(previousFocus.current);
            previousFocus.current = null;
        }
    }, [isReading, setFocusTarget]);

    const handleClose = () => {
        setReading(false);
        markRead();
    };

    return (
        <>
            {isReading && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(8px)',
                        pointerEvents: 'auto',
                        animation: 'fadeIn 0.3s ease-out'
                    }}
                    onClick={handleClose}
                    role="presentation"
                >
                    {/* Tờ THƯ (STATIONARY PAPER) - IMPROVED UI */}
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Lá thư tình yêu"
                        className="letter-paper"
                        style={{
                            position: 'relative',
                            width: 'min(95vw, 650px)',
                            minHeight: 'clamp(350px, 55vh, 500px)',
                            maxHeight: '85vh',
                            padding: 'clamp(25px, 4vw, 50px) clamp(30px, 5vw, 60px)',
                            backgroundColor: '#f5f1e8',
                            // Realistic paper texture effect
                            backgroundImage: `
                                linear-gradient(to right, rgba(0,0,0,0.015) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(0,0,0,0.015) 1px, transparent 1px),
                                radial-gradient(circle at 10% 10%, rgba(0,0,0,0.008) 0%, transparent 40%)
                            `,
                            backgroundSize: '20px 20px, 20px 20px, 100% 100%',
                            boxShadow: '0 50px 100px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(230, 220, 200, 0.5) inset',
                            borderRadius: '4px',
                            transform: 'rotateX(2deg) rotateY(-2deg)',
                            animation: 'letterHeroEntry 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards',
                            opacity: 0,
                            animationFillMode: 'forwards',
                            overflowY: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Vintage Tape/Seal decorations could go here */}

                        <button
                            onClick={handleClose}
                            aria-label="Đóng lá thư"
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'transparent',
                                border: 'none',
                                width: '30px', height: '30px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '24px',
                                cursor: 'pointer', color: '#8a001a', opacity: 0.5,
                                transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                        >✕</button>

                        <div style={{
                            fontFamily: "'Dancing Script', cursive",
                            color: '#3d2b1f',
                            fontSize: 'clamp(18px, 3.5vw, 26px)',
                            lineHeight: '1.7',
                            textAlign: 'left',
                            marginTop: '10px'
                        }}>
                            <TypewriterSequence>
                                {(activeStep, onStepComplete) => (
                                    <>
                                        <h1 style={{
                                            marginBottom: '25px',
                                            color: '#8b0000',
                                            fontSize: 'clamp(28px, 6vw, 40px)',
                                            fontWeight: '700',
                                            textAlign: 'center',
                                            textShadow: '0 2px 4px rgba(139,0,0,0.1)',
                                            minHeight: '1.2em'
                                        }}>
                                            {activeStep >= 0 && (
                                                <TypewriterText
                                                    text="Gửi em – người anh thương nhất,"
                                                    speed={50}
                                                    onComplete={() => onStepComplete(0)}
                                                />
                                            )}
                                        </h1>

                                        <div style={{ textIndent: '2em', marginBottom: '15px', minHeight: '3.4em' }}>
                                            {activeStep >= 1 && (
                                                <TypewriterText
                                                    text="Valentine này, anh không đếm ngày mình đã yêu nhau bao lâu, vì với anh, mỗi ngày có em đều là một ngày đáng nhớ. Chúng ta đã đi qua những lần giận hờn trẻ con, những lúc nhớ đến cồn cào vì yêu xa, nhưng sau tất cả, điều còn lại vẫn là hai chữ “ở lại”."
                                                    speed={30}
                                                    onComplete={() => onStepComplete(1)}
                                                />
                                            )}
                                        </div>

                                        <div style={{ textIndent: '2em', marginBottom: '15px', minHeight: '3.4em' }}>
                                            {activeStep >= 2 && (
                                                <TypewriterText
                                                    text="Yêu xa chưa bao giờ dễ dàng. Có những tối chỉ muốn được nắm tay em thay vì nhìn nhau qua màn hình. Nhưng anh tin rằng khoảng cách chỉ làm anh hiểu rõ hơn một điều: em quan trọng với anh đến nhường nào. Dù cách nhau bao nhiêu cây số, trái tim anh vẫn luôn chọn hướng về phía em."
                                                    speed={30}
                                                    onComplete={() => onStepComplete(2)}
                                                />
                                            )}
                                        </div>

                                        <div style={{ textIndent: '2em', marginBottom: '30px', minHeight: '3.4em' }}>
                                            {activeStep >= 3 && (
                                                <TypewriterText
                                                    text="Cảm ơn em vì đã kiên nhẫn, vì đã dịu dàng, vì đã cùng anh viết tiếp câu chuyện của chúng ta. Anh không hứa những điều quá lớn lao, chỉ hứa sẽ luôn cố gắng, luôn trân trọng, và luôn yêu em theo cách chân thành nhất."
                                                    speed={30}
                                                    onComplete={() => onStepComplete(3)}
                                                />
                                            )}
                                        </div>

                                        <div style={{
                                            marginTop: '40px',
                                            fontSize: 'clamp(20px, 4vw, 28px)',
                                            color: '#8b0000',
                                            textAlign: 'right',
                                            marginRight: '20px',
                                            transform: 'rotate(-2deg)',
                                            minHeight: '1.2em'
                                        }}>
                                            {activeStep >= 4 && (
                                                <TypewriterText
                                                    text="Valentine này, và rất nhiều Valentine sau nữa, anh vẫn muốn được nói với em rằng: Anh yêu em – nhiều hơn những gì anh có thể viết thành lời."
                                                    speed={50}
                                                    onComplete={() => onStepComplete(4)}
                                                />
                                            )}
                                        </div>
                                    </>
                                )}
                            </TypewriterSequence>

                            <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'center' }}>
                                {/* Wax Seal Effect */}
                                <div style={{
                                    width: '60px', height: '60px',
                                    background: 'linear-gradient(135deg, #b30000 0%, #800000 100%)',
                                    borderRadius: '50%',
                                    boxShadow: '0 4px 15px rgba(130,0,0,0.4), inset 0 2px 5px rgba(255,255,255,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '3px solid rgba(180,0,0,0.5)'
                                }}>
                                    <Heart size={32} fill="#600000" color="#500000" style={{ filter: 'drop-shadow(0 1px 1px rgba(255,255,255,0.2))' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* NÚT TIẾP THEO (CUTE BUTTON) - Hiện sau khi đóng thư */}
            {hasRead && !isReading && !isTransitioning && (
                <div style={{
                    position: 'fixed',
                    bottom: 'clamp(20px, 8vh, 50px)',
                    right: 'clamp(20px, 8vw, 50px)',
                    zIndex: 9000,
                    pointerEvents: 'auto',
                    animation: 'buttonPopIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                }}>
                    <button
                        onClick={() => {
                            setIsTransitioning(true);
                            requestAnimationFrame(() => requestTransition('climax'));
                        }}
                        aria-label="Khám phá điều bất ngờ tiếp theo"
                        className="group"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '16px 32px',
                            background: 'rgba(255, 255, 255, 0.15)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            borderRadius: '100px',
                            color: 'white',
                            fontSize: '18px',
                            fontFamily: "'Dancing Script', serif",
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = '0 15px 40px rgba(255, 50, 100, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                        }}
                    >
                        <span>Khám phá điều bất ngờ tiếp theo</span>
                        <div style={{ display: 'flex', color: '#ff4d6d' }}>
                            <Heart size={20} fill="#ff4d6d" style={{ animation: 'heartBeat 1.5s infinite' }} />
                        </div>
                        <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap');

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes letterHeroEntry {
                    0% { transform: scale(0.9) translateY(30px) rotateX(5deg); opacity: 0; }
                    30% { opacity: 0.9; }
                    100% { transform: scale(1) translateY(0) rotateX(2deg) rotateY(-2deg); opacity: 1; }
                }
                @keyframes buttonPopIn {
                    0% { transform: scale(0) translateY(20px); opacity: 0; }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
                @keyframes heartBeat {
                    0% { transform: scale(1); }
                    14% { transform: scale(1.3); }
                    28% { transform: scale(1); }
                    42% { transform: scale(1.3); }
                    70% { transform: scale(1); }
                }
            `}</style>
        </>
    );
};
