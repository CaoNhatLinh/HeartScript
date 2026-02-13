import React, { useEffect, useRef } from 'react';
import { useExperienceStore } from '../../../store/useExperienceStore';

export const StarDrawingOverlay: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const triggerConfetti = useExperienceStore(s => s.triggerConfetti);
    const isStarted = useExperienceStore(s => s.currentScene !== 'prelude');

    // Drawing state
    const isDrawing = useRef(false);
    const points = useRef<{ x: number, y: number }[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const handlePointerDown = (e: PointerEvent) => {
            if (!isStarted) return;
            isDrawing.current = true;
            points.current = [{ x: e.clientX, y: e.clientY }];
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (!isDrawing.current || points.current.length === 0) return;

            const lastPoint = points.current[points.current.length - 1];
            if (!lastPoint) return;

            const dist = Math.hypot(e.clientX - lastPoint.x, e.clientY - lastPoint.y);

            if (dist > 5) {
                points.current.push({ x: e.clientX, y: e.clientY });
                draw();
            }
        };

        const handlePointerUp = () => {
            if (!isDrawing.current) return;
            isDrawing.current = false;

            if (checkIfHeart(points.current)) {
                triggerConfetti();
                // Maybe play a sound or show a message
            }

            // Fade out the drawing
            fadeOut();
        };

        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (points.current.length < 2) return;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#fff';

            ctx.beginPath();
            ctx.moveTo(points.current[0].x, points.current[0].y);
            for (let i = 1; i < points.current.length; i++) {
                ctx.lineTo(points.current[i].x, points.current[i].y);
            }
            ctx.stroke();
        };

        const fadeOut = () => {
            let opacity = 0.8;
            const step = () => {
                opacity -= 0.05;
                if (opacity <= 0) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    points.current = [];
                    return;
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.globalAlpha = opacity;
                draw();
                ctx.globalAlpha = 1.0;
                requestAnimationFrame(step);
            };
            step();
        };

        const checkIfHeart = (pts: { x: number, y: number }[]) => {
            if (pts.length < 20) return false;

            // 1. Get bounds
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            pts.forEach(p => {
                minX = Math.min(minX, p.x);
                maxX = Math.max(maxX, p.x);
                minY = Math.min(minY, p.y);
                maxY = Math.max(maxY, p.y);
            });

            const width = maxX - minX;
            const height = maxY - minY;

            // 2. Aspect ratio check (Heart is usually wider or square-ish)
            const ratio = width / height;
            if (ratio < 0.5 || ratio > 2.0) return false;

            // 3. Simple path check:
            // Check if the bottom-most point is roughly in the horizontal center
            const bottomPoint = pts.reduce((prev, curr) => curr.y > prev.y ? curr : prev);
            const centerX = (minX + maxX) / 2;
            const bottomCentered = Math.abs(bottomPoint.x - centerX) < width * 0.25;

            // Check if it's "closed-ish" (start and end within 20% of width)
            const start = pts[0];
            const end = pts[pts.length - 1];
            const dist = Math.hypot(start.x - end.x, start.y - end.y);
            const closed = dist < width * 0.4;

            return bottomCentered && closed;
        };

        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isStarted, triggerConfetti]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[100]"
            style={{ mixBlendMode: 'screen' }}
        />
    );
};
