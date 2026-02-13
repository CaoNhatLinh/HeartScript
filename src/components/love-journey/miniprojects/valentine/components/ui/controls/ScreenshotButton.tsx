import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { useExperienceStore } from '../../../store/useExperienceStore';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Draw a rounded rectangle path on a canvas context.
 */
const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
};

/**
 * Draw frame decoration onto composite canvas based on selected frame type.
 */
const drawFrame = (ctx: CanvasRenderingContext2D, w: number, h: number, frame: string) => {
    ctx.save();
    const pad = 8;

    switch (frame) {
        case 'classic': {
            ctx.strokeStyle = '#E8AEB7';
            ctx.lineWidth = 6;
            roundRect(ctx, pad, pad, w - pad * 2, h - pad * 2, 12);
            ctx.stroke();
            // Bottom label
            ctx.font = '14px serif';
            ctx.fillStyle = 'rgba(232, 174, 183, 0.7)';
            ctx.textAlign = 'center';
            ctx.fillText('Valentine 2026', w / 2, h - 16);
            break;
        }
        case 'cute': {
            ctx.strokeStyle = '#ffb6c1';
            ctx.lineWidth = 8;
            ctx.setLineDash([16, 8]);
            roundRect(ctx, pad, pad, w - pad * 2, h - pad * 2, 30);
            ctx.stroke();
            ctx.setLineDash([]);
            // Label
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = 'rgba(255, 182, 193, 0.8)';
            ctx.textAlign = 'center';
            ctx.fillText('SWEET MOMENT', w / 2, h - 16);
            break;
        }
        case 'rose': {
            // Outer border
            ctx.strokeStyle = '#b76e79';
            ctx.lineWidth = 4;
            ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
            // Inner border
            ctx.strokeStyle = 'rgba(183, 110, 121, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(pad + 8, pad + 8, w - pad * 2 - 16, h - pad * 2 - 16);
            // Label
            ctx.font = 'italic 14px serif';
            ctx.fillStyle = 'rgba(183, 110, 121, 0.8)';
            ctx.textAlign = 'center';
            ctx.letterSpacing = '4px';
            ctx.fillText('L O V E', w / 2, h - 16);
            break;
        }
        case 'crystal': {
            ctx.strokeStyle = 'rgba(165, 243, 252, 0.6)';
            ctx.lineWidth = 3;
            roundRect(ctx, pad, pad, w - pad * 2, h - pad * 2, 16);
            ctx.stroke();
            // Shimmer lines
            ctx.strokeStyle = 'rgba(165, 243, 252, 0.3)';
            ctx.lineWidth = 1;
            const gradient1 = ctx.createLinearGradient(pad + 16, 0, w - pad - 16, 0);
            gradient1.addColorStop(0, 'transparent');
            gradient1.addColorStop(0.5, 'rgba(165, 243, 252, 0.3)');
            gradient1.addColorStop(1, 'transparent');
            ctx.strokeStyle = gradient1;
            ctx.beginPath();
            ctx.moveTo(pad + 16, pad + 8);
            ctx.lineTo(w - pad - 16, pad + 8);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(pad + 16, h - pad - 8);
            ctx.lineTo(w - pad - 16, h - pad - 8);
            ctx.stroke();
            break;
        }
        case 'floral': {
            ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
            ctx.lineWidth = 5;
            roundRect(ctx, pad, pad, w - pad * 2, h - pad * 2, 20);
            ctx.stroke();
            // Corner brackets
            const cSize = 24;
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 4;
            // Top-left
            ctx.beginPath(); ctx.moveTo(pad, pad + cSize); ctx.lineTo(pad, pad); ctx.lineTo(pad + cSize, pad); ctx.stroke();
            // Top-right
            ctx.beginPath(); ctx.moveTo(w - pad - cSize, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, pad + cSize); ctx.stroke();
            // Bottom-left
            ctx.beginPath(); ctx.moveTo(pad, h - pad - cSize); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + cSize, h - pad); ctx.stroke();
            // Bottom-right
            ctx.beginPath(); ctx.moveTo(w - pad - cSize, h - pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad, h - pad - cSize); ctx.stroke();
            break;
        }
        case 'cinematic': {
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
            // Letterbox bars
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, w, h * 0.1);
            ctx.fillRect(0, h * 0.9, w, h * 0.1);
            break;
        }
    }
    ctx.restore();
};

/**
 * ScreenshotButton - Chụp ảnh canvas + camera overlay (nếu bật) + frame viền
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

    // Composite capture: 3D scene + camera overlay + frame border
    const captureComposite = (canvas: HTMLCanvasElement): string => {
        const compositeCanvas = document.createElement('canvas');
        compositeCanvas.width = canvas.width;
        compositeCanvas.height = canvas.height;
        const ctx = compositeCanvas.getContext('2d');

        if (!ctx) return canvas.toDataURL("image/png");

        // 1. Draw 3D scene
        ctx.drawImage(canvas, 0, 0);

        // 2. Draw camera overlay if enabled
        if (cameraVideoRef && isCameraEnabled) {
            const scaleX = canvas.width / window.innerWidth;
            const scaleY = canvas.height / window.innerHeight;

            const camX = cameraPosition.x * scaleX;
            const camY = cameraPosition.y * scaleY;
            const camW = cameraSize.width * scaleX;
            const camH = cameraSize.height * scaleY;

            ctx.save();

            // Rounded corners clip
            const radius = 12 * scaleX;
            roundRect(ctx, camX, camY, camW, camH, radius);
            ctx.clip();

            // Mirror camera (default mirrored)
            ctx.translate(camX + camW, camY);
            ctx.scale(-1, 1);
            ctx.drawImage(cameraVideoRef, 0, 0, camW, camH);
            ctx.restore();

            // Camera border
            ctx.strokeStyle = 'rgba(255, 182, 193, 0.6)';
            ctx.lineWidth = 3 * scaleX;
            roundRect(ctx, camX, camY, camW, camH, radius);
            ctx.stroke();
        }

        // 3. Draw frame overlay if selected and visible
        const state = useExperienceStore.getState();
        if (state.frameVisible && state.selectedFrame) {
            drawFrame(ctx, canvas.width, canvas.height, state.selectedFrame);
        }

        return compositeCanvas.toDataURL("image/png");
    };

    // Countdown logic
    const startCountdown = () => {
        setCountdown(3);

        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(countdownInterval);
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

    // Perform capture
    const doCapture = () => {
        setScreenshotMode(true);
        setFlashing(true);

        // Increase timeout to ensure canvas is fully rendered
        setTimeout(() => {
            // Target the R3F canvas specifically (inside the .z-0 container)
            const canvas = document.querySelector('.z-0 canvas') as HTMLCanvasElement
                || document.querySelector('canvas');

            if (canvas) {
                console.log('Screenshot: Canvas dimensions:', canvas.width, 'x', canvas.height);

                // Check if canvas has valid dimensions
                if (canvas.width === 0 || canvas.height === 0) {
                    console.error('Screenshot: Canvas has invalid dimensions!');
                    setTimeout(() => {
                        setFlashing(false);
                        setScreenshotMode(false);
                    }, 400);
                    return;
                }

                try {
                    // For now, use direct canvas capture to test if the issue is with composite
                    const image = canvas.toDataURL("image/png");
                    console.log('Screenshot: Using direct canvas capture, length:', image.length);
                    console.log('Screenshot: About to set captured image, length:', image.length);
                    useExperienceStore.getState().setCapturedImage(image);
                    console.log('Screenshot: setCapturedImage called, checking store state...');
                    console.log('Screenshot: Store capturedImage after set:', useExperienceStore.getState().capturedImage?.length);
                } catch (e) {
                    console.error("Screenshot failed:", e);
                }
            } else {
                console.error('Screenshot: No canvas found!');
            }

            setTimeout(() => {
                setFlashing(false);
                setScreenshotMode(false);
            }, 400);
        }, 1000);
    };

    const handleScreenshot = () => {
        if (isCameraEnabled) {
            startCountdown();
        } else {
            doCapture();
        }
    };

    return (
        <>
            {/* Flash Overlay - Only render when flashing */}
            {flashing && (
                <div
                    className="fixed inset-0 bg-white z-[99999] pointer-events-none transition-opacity duration-300 opacity-100"
                />
            )}

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
                                style={{ width: 'clamp(120px, 30vw, 200px)', height: 'clamp(120px, 30vw, 200px)', transform: 'translate(-50%, -50%)', left: '50%', top: '50%' }}
                            />

                            {/* Number */}
                            <span className="font-bold text-white drop-shadow-2xl"
                                style={{
                                    fontSize: 'clamp(64px, 18vw, 128px)',
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
                aria-label="Chụp ảnh màn hình"
            >
                <Camera size={20} className="group-hover:rotate-12 transition-transform" />
                <span className="hidden md:inline text-sm">Chụp ảnh</span>
            </button>
        </>
    );
};
