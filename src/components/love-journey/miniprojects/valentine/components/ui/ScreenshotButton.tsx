import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ScreenshotButton - Chụp ảnh canvas + camera overlay (nếu bật)
 * Có countdown 3-2-1 nếu camera đang bật
 */
export const ScreenshotButton: React.FC = () => {
    const setScreenshotMode = useExperienceStore(s => s.setScreenshotMode);
    const isCameraEnabled = useExperienceStore(s => s.isCameraEnabled);
    const cameraVideoRef = useExperienceStore(s => s.cameraVideoRef);
    const cameraPosition = useExperienceStore(s => s.cameraPosition);
    const cameraSize = useExperienceStore(s => s.cameraSize);

    const [flashing, setFlashing] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);

    // Hàm capture với camera overlay
    const captureWithCamera = (canvas: HTMLCanvasElement): string => {
        if (!cameraVideoRef || !isCameraEnabled) {
            return canvas.toDataURL("image/png");
        }

        // Tạo canvas mới để composite
        const compositeCanvas = document.createElement('canvas');
        compositeCanvas.width = canvas.width;
        compositeCanvas.height = canvas.height;
        const ctx = compositeCanvas.getContext('2d');

        if (!ctx) return canvas.toDataURL("image/png");

        // 1. Vẽ canvas gốc (3D scene)
        ctx.drawImage(canvas, 0, 0);

        // 2. Tính toán vị trí camera trên composite canvas
        // Cần scale từ window coordinates sang canvas coordinates
        const scaleX = canvas.width / window.innerWidth;
        const scaleY = canvas.height / window.innerHeight;

        const camX = cameraPosition.x * scaleX;
        const camY = cameraPosition.y * scaleY;
        const camW = cameraSize.width * scaleX;
        const camH = cameraSize.height * scaleY;

        // 3. Vẽ camera video (đã mirror nếu cần)
        ctx.save();

        // Làm tròn góc bằng clip path
        const radius = 12 * scaleX;
        ctx.beginPath();
        ctx.moveTo(camX + radius, camY);
        ctx.lineTo(camX + camW - radius, camY);
        ctx.quadraticCurveTo(camX + camW, camY, camX + camW, camY + radius);
        ctx.lineTo(camX + camW, camY + camH - radius);
        ctx.quadraticCurveTo(camX + camW, camY + camH, camX + camW - radius, camY + camH);
        ctx.lineTo(camX + radius, camY + camH);
        ctx.quadraticCurveTo(camX, camY + camH, camX, camY + camH - radius);
        ctx.lineTo(camX, camY + radius);
        ctx.quadraticCurveTo(camX, camY, camX + radius, camY);
        ctx.closePath();
        ctx.clip();

        // Mirror camera nếu cần (mặc định là mirror)
        ctx.translate(camX + camW, camY);
        ctx.scale(-1, 1);
        ctx.drawImage(cameraVideoRef, 0, 0, camW, camH);

        ctx.restore();

        // 4. Vẽ border cute cho camera
        ctx.strokeStyle = 'rgba(255, 182, 193, 0.6)';
        ctx.lineWidth = 3 * scaleX;
        ctx.beginPath();
        ctx.moveTo(camX + radius, camY);
        ctx.lineTo(camX + camW - radius, camY);
        ctx.quadraticCurveTo(camX + camW, camY, camX + camW, camY + radius);
        ctx.lineTo(camX + camW, camY + camH - radius);
        ctx.quadraticCurveTo(camX + camW, camY + camH, camX + camW - radius, camY + camH);
        ctx.lineTo(camX + radius, camY + camH);
        ctx.quadraticCurveTo(camX, camY + camH, camX, camY + camH - radius);
        ctx.lineTo(camX, camY + radius);
        ctx.quadraticCurveTo(camX, camY, camX + radius, camY);
        ctx.closePath();
        ctx.stroke();

        return compositeCanvas.toDataURL("image/png");
    };

    // Countdown logic
    const startCountdown = () => {
        setCountdown(3);

        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(countdownInterval);
                    // Chụp sau khi countdown xong
                    setTimeout(() => {
                        setCountdown(null);
                        doCapture();
                    }, 500);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Thực hiện chụp
    const doCapture = () => {
        setScreenshotMode(true);
        setFlashing(true);

        setTimeout(() => {
            const canvas = document.querySelector('canvas');
            if (canvas) {
                try {
                    const image = captureWithCamera(canvas);
                    useExperienceStore.getState().setCapturedImage(image);
                } catch (e) {
                    console.error("Screenshot failed:", e);
                }
            }

            setTimeout(() => {
                setFlashing(false);
                setScreenshotMode(false);
            }, 400);
        }, 300);
    };

    const handleScreenshot = () => {
        if (isCameraEnabled) {
            // Có camera -> countdown trước
            startCountdown();
        } else {
            // Không có camera -> chụp ngay
            doCapture();
        }
    };

    return (
        <>
            {/* Flash Overlay */}
            <div
                className={`fixed inset-0 bg-white z-[99999] pointer-events-none transition-opacity duration-300 ${flashing ? 'opacity-100' : 'opacity-0'}`}
                style={{ visibility: flashing ? 'visible' : 'hidden' }}
            />

            {/* Countdown Overlay */}
            <AnimatePresence>
                {countdown !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none"
                    >
                        <motion.div
                            key={countdown}
                            initial={{ scale: 2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ type: 'spring', damping: 15 }}
                            className="relative"
                        >
                            {/* Glow ring */}
                            <div className="absolute inset-0 rounded-full bg-pink-500/30 blur-3xl animate-pulse"
                                style={{ width: 200, height: 200, transform: 'translate(-50%, -50%)', left: '50%', top: '50%' }}
                            />

                            {/* Number */}
                            <span className="text-9xl font-bold text-white drop-shadow-2xl"
                                style={{
                                    textShadow: '0 0 40px rgba(255,105,180,0.8), 0 0 80px rgba(255,105,180,0.5)',
                                    fontFamily: 'system-ui, -apple-system, sans-serif'
                                }}
                            >
                                {countdown}
                            </span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={handleScreenshot}
                disabled={countdown !== null}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-pink-100 font-bold border border-white/20 hover:bg-white/20 hover:scale-105 active:scale-95 transition-all shadow-lg group disabled:opacity-50 disabled:cursor-not-allowed"
                title="Chụp khoảnh khắc"
            >
                <Camera size={20} className="group-hover:rotate-12 transition-transform" />
                <span className="hidden md:inline text-sm">Chụp ảnh</span>
            </button>
        </>
    );
};
