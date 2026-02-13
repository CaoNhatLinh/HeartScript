'use client';

import { useRef, useEffect, memo } from 'react';
import { useAudioStore } from '../../../store/useAudioStore';

interface AudioVisualizerProps {
    /** Width of the canvas */
    width?: number;
    /** Height of the canvas */
    height?: number;
    /** Number of bars to display */
    barCount?: number;
    /** Visual style */
    variant?: 'bars' | 'wave' | 'circle';
    /** Color gradient start */
    colorStart?: string;
    /** Color gradient end */
    colorEnd?: string;
    /** Additional className */
    className?: string;
}

const BAR_GAP = 2;
const SMOOTHING = 0.15; // Lerp factor for smooth transitions

/**
 * AudioVisualizer — Phase 10
 * Renders real-time audio frequency data from useAudioStore.
 * Supports bar, wave, and circular visualization modes.
 */
const AudioVisualizer = memo(function AudioVisualizer({
    width = 120,
    height = 32,
    barCount = 16,
    variant = 'bars',
    colorStart = '#ec4899',
    colorEnd = '#a855f7',
    className = '',
}: AudioVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);
    const prevHeightsRef = useRef<Float32Array | null>(null);
    const drawFrameRef = useRef<(() => void) | null>(null);
    const { analyser, isPlaying } = useAudioStore();

    useEffect(() => {
        drawFrameRef.current = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Get raw frequency data
            const bufferLength = analyser?.frequencyBinCount ?? 0;
            const dataArray = new Uint8Array(bufferLength || 1);
            if (analyser && isPlaying) {
                analyser.getByteFrequencyData(dataArray);
            }

            // Initialize prev heights
            if (!prevHeightsRef.current || prevHeightsRef.current.length !== barCount) {
                prevHeightsRef.current = new Float32Array(barCount);
            }
            const prevH = prevHeightsRef.current;

            ctx.clearRect(0, 0, width, height);

            if (variant === 'bars') {
                drawBars(ctx, dataArray, bufferLength, prevH, barCount, width, height, colorStart, colorEnd);
            } else if (variant === 'wave') {
                drawWave(ctx, dataArray, bufferLength, width, height, colorStart, colorEnd);
            } else if (variant === 'circle') {
                drawCircle(ctx, dataArray, bufferLength, prevH, barCount, width, height, colorStart, colorEnd);
            }

            // Schedule next frame
            animFrameRef.current = requestAnimationFrame(drawFrameRef.current!);
        };
    }, [analyser, isPlaying, barCount, width, height, variant, colorStart, colorEnd]);

    useEffect(() => {
        if (drawFrameRef.current) {
            animFrameRef.current = requestAnimationFrame(drawFrameRef.current);
        }
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={`pointer-events-none ${className}`}
            aria-hidden="true"
            role="img"
            aria-label="Audio visualizer"
        />
    );
});

export default AudioVisualizer;

// ─── Drawing helpers ───────────────────────────────────────────

function drawBars(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    bufferLen: number,
    prevH: Float32Array,
    barCount: number,
    w: number,
    h: number,
    c1: string,
    c2: string,
) {
    const barW = (w - BAR_GAP * (barCount - 1)) / barCount;
    const step = Math.max(1, Math.floor(bufferLen / barCount));

    for (let i = 0; i < barCount; i++) {
        // Sample a range of frequency bins for this bar
        let sum = 0;
        for (let j = 0; j < step; j++) {
            const idx = i * step + j;
            sum += idx < bufferLen ? data[idx] : 0;
        }
        const raw = (sum / step / 255) * h;
        // Smooth with lerp
        prevH[i] += (raw - prevH[i]) * SMOOTHING;
        const barH = Math.max(2, prevH[i]);

        const x = i * (barW + BAR_GAP);
        const y = h - barH;

        // Gradient per bar
        const grad = ctx.createLinearGradient(x, h, x, y);
        grad.addColorStop(0, c1);
        grad.addColorStop(1, c2);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 1);
        ctx.fill();
    }
}

function drawWave(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    bufferLen: number,
    w: number,
    h: number,
    c1: string,
    c2: string,
) {
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const step = Math.max(1, Math.floor(bufferLen / w));
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
        const idx = x * step;
        const val = idx < bufferLen ? data[idx] / 255 : 0;
        const y = h - val * h * 0.9;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Subtle fill
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
    fillGrad.addColorStop(0, c1 + '40');
    fillGrad.addColorStop(1, c2 + '10');
    ctx.fillStyle = fillGrad;
    ctx.fill();
}

function drawCircle(
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    bufferLen: number,
    prevH: Float32Array,
    barCount: number,
    w: number,
    h: number,
    c1: string,
    c2: string,
) {
    const cx = w / 2;
    const cy = h / 2;
    const baseR = Math.min(cx, cy) * 0.4;
    const maxR = Math.min(cx, cy) * 0.9;
    const step = Math.max(1, Math.floor(bufferLen / barCount));
    const angleStep = (Math.PI * 2) / barCount;

    for (let i = 0; i < barCount; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
            const idx = i * step + j;
            sum += idx < bufferLen ? data[idx] : 0;
        }
        const raw = sum / step / 255;
        prevH[i] += (raw - prevH[i]) * SMOOTHING;
        const r = baseR + prevH[i] * (maxR - baseR);

        const angle = i * angleStep - Math.PI / 2;
        const x1 = cx + Math.cos(angle) * baseR;
        const y1 = cy + Math.sin(angle) * baseR;
        const x2 = cx + Math.cos(angle) * r;
        const y2 = cy + Math.sin(angle) * r;

        const t = i / barCount;
        ctx.strokeStyle = lerpColor(c1, c2, t);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

function lerpColor(a: string, b: string, t: number): string {
    const parse = (hex: string) => {
        const h = hex.replace('#', '');
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    };
    const [r1, g1, b1] = parse(a);
    const [r2, g2, b2] = parse(b);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const bl = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${bl})`;
}
