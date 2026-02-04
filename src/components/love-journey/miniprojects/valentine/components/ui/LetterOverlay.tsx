import React from 'react';
import { ChevronRight, Heart } from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';

export const LetterOverlay: React.FC = () => {
    const isReading = useExperienceStore((s) => s.isReadingLetter);
    const setReading = useExperienceStore((s) => s.setReadingLetter);
    const hasRead = useExperienceStore((s) => s.hasReadLetter);
    const markRead = useExperienceStore((s) => s.markReadLetter);
    const requestTransition = useExperienceStore((s) => s.requestSceneTransition);

    const [isTransitioning, setIsTransitioning] = React.useState(false);

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
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(4px)',
                        pointerEvents: 'auto'
                    }}
                    onClick={handleClose}
                >
                    {/* TỜ THƯ (STATIONARY PAPER) */}
                    <div
                        style={{
                            position: 'relative',
                            width: 'min(90vw, 420px)',
                            minHeight: '580px',
                            padding: '60px 45px',
                            background: '#fdfaf2',
                            backgroundImage: 'repeating-linear-gradient(#fdfaf2, #fdfaf2 31px, #e5e5e5 31px, #e5e5e5 32px)',
                            boxShadow: '0 40px 100px rgba(0,0,0,0.5), inset 0 0 80px rgba(255,255,255,0.5)',
                            borderRadius: '3px',
                            transform: 'rotateX(4deg) rotateY(-4deg) rotateZ(1deg)',
                            animation: 'letterHeroEntry 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                            border: '1px solid #e0d5b5',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleClose}
                            style={{
                                position: 'absolute', top: '20px', right: '20px',
                                background: 'none', border: 'none', fontSize: '32px',
                                cursor: 'pointer', color: '#8a001a', opacity: 0.6
                            }}
                        >✕</button>

                        <div style={{
                            fontFamily: "'Dancing Script', cursive",
                            color: '#2c2c2c', fontSize: '24px', lineHeight: '1.6',
                            textAlign: 'center', marginTop: '20px'
                        }}>
                            <h1 style={{ marginBottom: '30px', color: '#b30000', fontSize: '34px', fontWeight: 'normal' }}>
                                My Dearest,
                            </h1>
                            <p>Cảm ơn em vì đã đến và mang theo ánh nắng ấm áp cho cuộc đời anh. Mỗi bông hoa trong khu vườn này đều nở vì nụ cười của em.</p>
                            <p style={{ marginTop: '20px' }}>Chúc em một ngày Valentine thật ngọt ngào và hạnh phúc!</p>
                            <div style={{ marginTop: '50px', fontSize: '28px', color: '#b30000' }}>
                                Love you always.
                            </div>

                            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
                                <div style={{
                                    width: '50px', height: '50px', background: '#b30000',
                                    borderRadius: '50%', boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '2px solid #ffbf00'
                                }}>
                                    <div style={{ width: '30px', height: '30px', border: '1px solid #ffbf00', borderRadius: '50%' }} />
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
                    bottom: '40px',
                    right: '40px',
                    zIndex: 9000,
                    pointerEvents: 'auto',
                    animation: 'buttonPopIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                }}>
                    <button
                        onClick={() => {
                            setIsTransitioning(true); // Hide immediately
                            // Small delay to allow react to render the hidden state before blocking main thread
                            requestAnimationFrame(() => requestTransition('climax'));
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '16px 32px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '50px',
                            color: 'white',
                            fontSize: '18px',
                            fontFamily: 'serif',
                            cursor: 'pointer',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 15px 40px rgba(255, 50, 100, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                        }}
                    >
                        <span>Nhận tiếp món quà ngạc nhiên</span>
                        <div style={{ display: 'flex', color: '#ff4d6d' }}>
                            <Heart size={20} fill="#ff4d6d" style={{ animation: 'heartBeat 1.5s infinite' }} />
                        </div>
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            <style>{`
                @keyframes letterHeroEntry {
                    0% { transform: scale(0.4) translateY(100px) rotateX(20deg) rotateZ(10deg); opacity: 0; }
                    100% { transform: scale(1) translateY(0) rotateX(4deg) rotateY(-4deg) rotateZ(1deg); opacity: 1; }
                }
                @keyframes buttonPopIn {
                    0% { transform: scale(0) translateY(50px); opacity: 0; }
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
