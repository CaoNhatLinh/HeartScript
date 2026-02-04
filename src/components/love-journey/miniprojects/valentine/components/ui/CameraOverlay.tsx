import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useDragControls, AnimatePresence } from 'framer-motion';
import {
    Camera as CameraIcon, CameraOff, Maximize2, Minimize2,
    FlipHorizontal, Sparkles, X, Settings2,
    Sun, Contrast, Palette, Wand2
} from 'lucide-react';
import { useExperienceStore } from '../../store/useExperienceStore';
import { FaceMesh, type Results } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

interface CameraFilters {
    brightness: number;
    contrast: number;
    saturate: number;
    blur: number;
    hueRotate: number;
}

const DEFAULT_FILTERS: CameraFilters = {
    brightness: 1.0,
    contrast: 1.0,
    saturate: 1.1,
    blur: 0,
    hueRotate: 0
};

const FILTER_PRESETS = [
    { name: 'Normal', icon: '✨', filters: { brightness: 1.0, contrast: 1.0, saturate: 1.1, blur: 0, hueRotate: 0 } },
    { name: 'Beauty', icon: '💖', filters: { brightness: 1.05, contrast: 0.95, saturate: 1.05, blur: 1, hueRotate: 0 } },
    { name: 'Warm', icon: '🌅', filters: { brightness: 1.05, contrast: 1.05, saturate: 1.2, blur: 0, hueRotate: -10 } },
    { name: 'Cool', icon: '💎', filters: { brightness: 1.0, contrast: 1.05, saturate: 0.9, blur: 0, hueRotate: 20 } },
    { name: 'Vintage', icon: '🌸', filters: { brightness: 1.1, contrast: 0.9, saturate: 0.8, blur: 0.5, hueRotate: -15 } },
] as const;

// MediaPipe Landmark Indices
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const LEFT_EYE = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7];
const RIGHT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
const LIPS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
const LEFT_EYEBROW = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
const RIGHT_EYEBROW = [336, 296, 334, 293, 300, 276, 283, 282, 295, 285];

export const CameraOverlay: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();
    const hideControlsTimer = useRef<number | null>(null);

    // AI Refs
    const faceMeshRef = useRef<FaceMesh | null>(null);
    const cameraRef = useRef<Camera | null>(null);

    // Local state
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isMirrored, setIsMirrored] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [filters, setFilters] = useState<CameraFilters>(DEFAULT_FILTERS);
    const [showFilters, setShowFilters] = useState(false);

    // AI State
    const [isAiEnabled, setIsAiEnabled] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Store state
    const isCameraEnabled = useExperienceStore(s => s.isCameraEnabled);
    const setCameraEnabled = useExperienceStore(s => s.setCameraEnabled);
    const setCameraVideoRef = useExperienceStore(s => s.setCameraVideoRef);
    const cameraPosition = useExperienceStore(s => s.cameraPosition);
    const setCameraPosition = useExperienceStore(s => s.setCameraPosition);
    const cameraSize = useExperienceStore(s => s.cameraSize);
    const setCameraSize = useExperienceStore(s => s.setCameraSize);

    // Hover handlers
    const handleMouseEnter = useCallback(() => {
        if (hideControlsTimer.current) {
            clearTimeout(hideControlsTimer.current);
            hideControlsTimer.current = null;
        }
        setShowControls(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (isExpanded || showFilters) return;
        hideControlsTimer.current = window.setTimeout(() => {
            setShowControls(false);
        }, 500);
    }, [isExpanded, showFilters]);

    // Initialize MediaPipe FaceMesh
    const initFaceMesh = useCallback(async () => {
        if (faceMeshRef.current || !videoRef.current) return;

        setIsAiLoading(true);
        try {
            const faceMesh = new FaceMesh({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                }
            });

            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            faceMesh.onResults(onResults);
            faceMeshRef.current = faceMesh;

            if (videoRef.current) {
                const camera = new Camera(videoRef.current, {
                    onFrame: async () => {
                        if (faceMeshRef.current && videoRef.current) {
                            await faceMeshRef.current.send({ image: videoRef.current });
                        }
                    },
                    width: 640,
                    height: 480
                });
                camera.start();
                cameraRef.current = camera;
            }
        } catch (error) {
            console.error("Failed to init AI:", error);
        } finally {
            setIsAiLoading(false);
        }
    }, []);

    // Stop AI
    const stopAi = useCallback(() => {
        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }
        // Assuming faceMesh doesn't need explicit stop, just GC
        // But we keep ref if we want to restart quickly? No, simpler to rebuild to ensure clean state
        faceMeshRef.current = null;
    }, []);

    // AI Processing Loop - IMPROVED NATURAL FILTER
    const onResults = (results: Results) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        // Use 'alpha: false' if possible for performance, but we rely on composition
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const { width, height } = canvas;

        // 1. Draw ORIGINAL SHARP Image (Bottom Layer)
        // This ensures eyes, mouth, hair, and background remain perfectly sharp and natural.
        // We do clearRect first just in case, though drawing full image overwrites.
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none';
        ctx.globalAlpha = 1.0;
        ctx.drawImage(results.image, 0, 0, width, height);

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];

            ctx.save(); // Save state before clipping

            // 2. Define Mask Region: Face Oval MINUS Features (Eyes, Lips, Eyebrows)
            // Using 'evenodd' clipping rule: Inner paths will be holes.
            const path = new Path2D();

            const addPathPoints = (indices: number[], close: boolean = true) => {
                if (indices.length === 0) return;
                const first = landmarks[indices[0]];
                path.moveTo(first.x * width, first.y * height);
                for (let i = 1; i < indices.length; i++) {
                    const point = landmarks[indices[i]];
                    path.lineTo(point.x * width, point.y * height);
                }
                if (close) path.closePath();
            };

            // Add areas to single Path2D
            addPathPoints(FACE_OVAL);       // Outer Shape -> Filled
            addPathPoints(LEFT_EYE);        // Inner Shape -> Hole (with evenodd)
            addPathPoints(RIGHT_EYE);       // Inner Shape -> Hole
            addPathPoints(LIPS);            // Inner Shape -> Hole
            addPathPoints(LEFT_EYEBROW);    // Inner Shape -> Hole
            addPathPoints(RIGHT_EYEBROW);   // Inner Shape -> Hole

            // Clip: Restrict subsequent drawing ONLY to the Skin (excluding eyes/lips/brows)
            ctx.clip(path, "evenodd");

            // 3. Draw BLURRED Skin Layer (Top Layer)
            // We draw the SAME image again, but blurred and semi-transparent.
            // Result: Skin regions are smoothed. Eyes/Mouth holes show the sharp Layer 1 underneath.
            ctx.filter = 'blur(2px)';     // Reduced blur for more natural look
            ctx.globalAlpha = 0.4;        // Reduced opacity for subtle smoothing
            ctx.drawImage(results.image, 0, 0, width, height);

            ctx.restore(); // Remove clip
        }
    };

    // Toggle AI
    const toggleAi = () => {
        if (isAiEnabled) {
            stopAi();
            setIsAiEnabled(false);
        } else {
            setIsAiEnabled(true);
            initFaceMesh();
        }
    };

    // ... (Hooks for start/stop camera similar to before)
    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, // 480p is enough for Web AI
                audio: false
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setCameraVideoRef(videoRef.current);
            }
        } catch (error) {
            console.error('Failed to access camera:', error);
            setCameraEnabled(false);
        }
    }, [setCameraEnabled, setCameraVideoRef]);

    const stopCamera = useCallback(() => {
        stopAi(); // Stop AI too
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraVideoRef(null);
    }, [stream, setCameraVideoRef, stopAi]);

    const toggleCamera = useCallback(() => {
        if (isCameraEnabled) {
            stopCamera();
            setCameraEnabled(false);
        } else {
            setCameraEnabled(true);
            startCamera();
        }
    }, [isCameraEnabled, startCamera, stopCamera, setCameraEnabled]);

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            stopAi();
        };
    }, [stream, stopAi]);

    useEffect(() => {
        if (videoRef.current && stream) {
            setCameraVideoRef(videoRef.current);
        }
    }, [stream, setCameraVideoRef]);

    // CSS filter
    const getFilterStyle = (): string => {
        return `brightness(${filters.brightness}) contrast(${filters.contrast}) saturate(${filters.saturate}) blur(${filters.blur}px) hue-rotate(${filters.hueRotate}deg)`;
    };

    const applyPreset = (preset: typeof FILTER_PRESETS[number]) => {
        setFilters(preset.filters);
    };

    const updateFilter = (key: keyof CameraFilters, value: number) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleDragEnd = (_: unknown, info: { offset: { x: number; y: number } }) => {
        setCameraPosition({
            x: cameraPosition.x + info.offset.x,
            y: cameraPosition.y + info.offset.y
        });
    };

    // Debounce resize to prevent freezing
    const resizeTimeoutRef = useRef<number | null>(null);

    const handleResize = useCallback((_: unknown, info: { delta: { x: number; y: number } }) => {
        if (isExpanded) setIsExpanded(false);
        const newWidth = Math.max(160, cameraSize.width + info.delta.x);
        const newHeight = Math.max(120, cameraSize.height + info.delta.y);

        if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = window.setTimeout(() => {
            setCameraSize({ width: newWidth, height: newHeight });
        }, 16); // ~60fps debounce
    }, [isExpanded, cameraSize]);

    return (
        <>
            {/* Toggle Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`
                    fixed bottom-4 left-1/2 -translate-x-1/2 z-50 
                    p-3 rounded-full shadow-lg backdrop-blur-md
                    transition-all pointer-events-auto
                    ${isCameraEnabled
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-2 border-pink-300/50'
                        : 'bg-black/60 text-white/80 border border-white/10 hover:bg-black/80'
                    }
                `}
                onClick={toggleCamera}
                title={isCameraEnabled ? 'Tắt camera' : 'Bật camera'}
            >
                {isCameraEnabled ? <CameraOff size={22} /> : <CameraIcon size={22} />}
            </motion.button>

            {/* Camera Preview Window */}
            <AnimatePresence>
                {isCameraEnabled && (
                    <motion.div
                        ref={containerRef}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            x: cameraPosition.x,
                            y: cameraPosition.y,
                            width: cameraSize.width,
                            height: cameraSize.height
                        }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        drag
                        dragControls={dragControls}
                        dragMomentum={false}
                        dragElastic={0.1}
                        onDragEnd={handleDragEnd}
                        className="fixed z-50 cursor-move pointer-events-auto"
                        style={{ touchAction: 'none', top: 0, left: 0 }}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {/* Outer Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-pink-400/30 via-rose-300/30 to-pink-400/30 rounded-2xl blur-md" />

                        {/* Main Container */}
                        <div className="relative w-full h-full rounded-xl overflow-hidden
                                        border-2 border-pink-200/40
                                        shadow-[0_4px_30px_rgba(236,72,153,0.2),inset_0_0_20px_rgba(255,255,255,0.05)]
                                        bg-black/20">

                            {/* Corner Decorations */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-pink-300/60 rounded-tl-lg z-10" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-pink-300/60 rounded-tr-lg z-10" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-pink-300/60 rounded-bl-lg z-10" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-pink-300/60 rounded-br-lg z-10" />

                            {/* Video Source (Hidden when AI Enabled) */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover transition-opacity duration-500 transform
                                            ${isAiEnabled ? 'opacity-0 absolute inset-0' : 'opacity-100'}`}
                                style={{
                                    filter: isAiEnabled ? 'none' : getFilterStyle(),
                                    transform: isMirrored ? 'scaleX(-1)' : 'none'
                                }}
                            />

                            {/* AI Canvas Output */}
                            <canvas
                                ref={canvasRef}
                                width={cameraSize.width} // Dynamic width
                                height={cameraSize.height} // Dynamic height
                                className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-500 pointer-events-none
                                            ${isAiEnabled ? 'opacity-100' : 'opacity-0'}`}
                                style={{
                                    transform: isMirrored ? 'scaleX(-1)' : 'none',
                                    filter: isAiEnabled ? getFilterStyle() : 'none' // Apply brightness/contrast ON TOP of AI
                                }}
                            />

                            {/* Loading Indicator */}
                            {isAiLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
                                    <div className="flex flex-col items-center gap-2 text-pink-300">
                                        <Sparkles className="animate-spin" />
                                        <span className="text-xs">Đang bật AI Beauty...</span>
                                    </div>
                                </div>
                            )}

                            {/* Controls Overlay */}
                            <AnimatePresence>
                                {showControls && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-20"
                                    >
                                        <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-center">
                                            <div className="flex gap-1">
                                                <button
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    onClick={() => setIsMirrored(!isMirrored)}
                                                    className="p-1.5 rounded-lg bg-black/40 text-white/80 hover:bg-black/60 transition-colors"
                                                    title="Lật gương"
                                                >
                                                    <FlipHorizontal size={14} />
                                                </button>
                                                <button
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    onClick={toggleAi}
                                                    className={`p-1.5 rounded-lg transition-colors flex items-center gap-1
                                                        ${isAiEnabled ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg' : 'bg-black/40 text-white/80 hover:bg-black/60'}
                                                    `}
                                                    title={isAiEnabled ? "Tắt AI Beauty (Nặng máy)" : "Bật AI Beauty (Thử nghiệm)"}
                                                >
                                                    <Wand2 size={14} />
                                                </button>
                                                <button
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    onClick={() => {
                                                        if (isExpanded) {
                                                            setCameraSize({ width: 240, height: 180 });
                                                        } else {
                                                            setCameraSize({ width: 320, height: 240 });
                                                        }
                                                        setIsExpanded(!isExpanded);
                                                    }}
                                                    className="p-1.5 rounded-lg bg-black/40 text-white/80 hover:bg-black/60 transition-colors"
                                                    title={isExpanded ? 'Thu nhỏ' : 'Phóng to'}
                                                >
                                                    {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                                                </button>
                                            </div>
                                            <button
                                                onPointerDown={(e) => e.stopPropagation()}
                                                onClick={toggleCamera}
                                                className="p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-600 transition-colors"
                                                title="Đóng camera"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>

                                        <div className="absolute bottom-0 left-0 right-0 p-2">
                                            <div className="flex gap-1 justify-center">
                                                {FILTER_PRESETS.map((preset) => (
                                                    <button
                                                        key={preset.name}
                                                        onPointerDown={(e) => e.stopPropagation()}
                                                        onClick={() => applyPreset(preset)}
                                                        className={`
                                                            px-2 py-1 rounded-full text-[10px] font-medium
                                                            transition-all hover:scale-105
                                                            ${filters.brightness === preset.filters.brightness && filters.saturate === preset.filters.saturate
                                                                ? 'bg-pink-500 text-white'
                                                                : 'bg-black/40 text-white/80 hover:bg-black/60'
                                                            }
                                                        `}
                                                        title={preset.name}
                                                    >
                                                        {preset.icon}
                                                    </button>
                                                ))}
                                                <button
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    onClick={() => setShowFilters(!showFilters)}
                                                    className={`
                                                        p-1.5 rounded-full transition-all
                                                        ${showFilters ? 'bg-pink-500 text-white' : 'bg-black/40 text-white/80 hover:bg-black/60'}
                                                    `}
                                                    title="Tùy chỉnh filter"
                                                >
                                                    <Settings2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Filter Panel */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="absolute left-full top-0 ml-3 w-48 bg-black/80 backdrop-blur-lg rounded-xl p-3 border border-white/10 shadow-xl z-50"
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <div className="text-xs text-white/60 mb-2 flex items-center gap-1">
                                        <Sparkles size={12} />
                                        Tùy chỉnh Filter
                                    </div>

                                    {/* Brightness */}
                                    <label className="flex items-center gap-2 text-[10px] text-white/80 mb-2">
                                        <Sun size={10} />
                                        Sáng
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="1.5"
                                            step="0.05"
                                            value={filters.brightness}
                                            onChange={(e) => updateFilter('brightness', parseFloat(e.target.value))}
                                            className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-pink-500"
                                        />
                                    </label>

                                    {/* Contrast */}
                                    <label className="flex items-center gap-2 text-[10px] text-white/80 mb-2">
                                        <Contrast size={10} />
                                        Tương phản
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="1.5"
                                            step="0.05"
                                            value={filters.contrast}
                                            onChange={(e) => updateFilter('contrast', parseFloat(e.target.value))}
                                            className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-pink-500"
                                        />
                                    </label>

                                    {/* Saturation */}
                                    <label className="flex items-center gap-2 text-[10px] text-white/80 mb-2">
                                        <Palette size={10} />
                                        Bão hòa
                                        <input
                                            type="range"
                                            min="0"
                                            max="2"
                                            step="0.1"
                                            value={filters.saturate}
                                            onChange={(e) => updateFilter('saturate', parseFloat(e.target.value))}
                                            className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-pink-500"
                                        />
                                    </label>

                                    {/* Blur/Beauty (Only works in Basic Mode, AI supersedes this or this adds to AI?) */}
                                    {/* Let's keep it, it affects CSS filter on top of AI canvas too */}
                                    <label className="flex items-center gap-2 text-[10px] text-white/80">
                                        <Sparkles size={10} />
                                        Làm mịn (CSS)
                                        <input
                                            type="range"
                                            min="0"
                                            max="3"
                                            step="0.5"
                                            value={filters.blur}
                                            onChange={(e) => updateFilter('blur', parseFloat(e.target.value))}
                                            className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-pink-500"
                                        />
                                    </label>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Resize Handle */}
                        <motion.div
                            className="absolute bottom-0 right-0 w-6 h-6 z-50 cursor-nwse-resize flex items-end justify-end p-1 opacity-100 transition-opacity"
                            drag
                            dragMomentum={false}
                            dragElastic={0}
                            onDrag={handleResize}
                            onPointerDown={(e) => e.stopPropagation()}
                            title="Kéo để thay đổi kích thước"
                        >
                            <div className="w-2 h-2 bg-white/80 rounded-full shadow-sm ring-2 ring-pink-500/50" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
