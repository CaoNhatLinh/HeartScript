import React, { useEffect, useRef } from 'react';
import { useExperienceStore } from '../../../store/useExperienceStore';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    type: 'star' | 'heart' | 'sparkle';
}

export const CursorSparkles: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const mouse = useRef({ x: 0, y: 0, moved: false });
    const isFrozen = useExperienceStore(s => s.isFrozen);
    const performanceLevel = useExperienceStore(s => s.performanceLevel);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize handler
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Mouse handler
        const handleMouseMove = (e: MouseEvent) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
            mouse.current.moved = true;

            // Add particles on move with reduced density (20% chance)
            if (Math.random() < 0.2) {
                const limit = performanceLevel === 'low' ? 1 : 2;
                for (let i = 0; i < limit; i++) {
                    addParticle(e.clientX, e.clientY);
                }
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                mouse.current.x = e.touches[0].clientX;
                mouse.current.y = e.touches[0].clientY;
                mouse.current.moved = true;

                // Add particles on move with reduced density (20% chance)
                if (Math.random() < 0.2) {
                    const limit = performanceLevel === 'low' ? 1 : 2;
                    for (let i = 0; i < limit; i++) {
                        addParticle(e.touches[0].clientX, e.touches[0].clientY);
                    }
                }
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);

        // Particle System
        const colors = ['#ffccd5', '#fff0f3', '#ffb3c1', '#ffd700', '#ffffff'];

        const addParticle = (x: number, y: number) => {
            const size = Math.random() * 8 + 4;
            const typeProb = Math.random();
            const type = typeProb > 0.7 ? 'heart' : (typeProb > 0.4 ? 'star' : 'sparkle');

            particles.current.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5 + 0.5, // Slight drop
                life: 1.0,
                size,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                type
            });
        };

        const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * r, -Math.sin(((18 + i * 72) * Math.PI) / 180) * r);
                ctx.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * (r * 0.5), -Math.sin(((54 + i * 72) * Math.PI) / 180) * (r * 0.5));
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        };

        const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            ctx.save();
            ctx.translate(x, y);
            const scale = size / 10;
            ctx.scale(scale, scale);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-5, -5, -10, 0, 0, 10);
            ctx.bezierCurveTo(10, 0, 5, -5, 0, 0);
            ctx.fill();
            ctx.restore();
        };

        // Animation Loop
        let animationFrame: number;
        const animate = () => {
            // Only clear partially for trails? No, clear fully for cleaner look
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and Draw
            for (let i = particles.current.length - 1; i >= 0; i--) {
                const p = particles.current[i];
                p.life -= 0.02;
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.rotationSpeed;

                if (p.life <= 0) {
                    particles.current.splice(i, 1);
                    continue;
                }

                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.translate(-p.x, -p.y);

                if (p.type === 'star') {
                    drawStar(ctx, p.x, p.y, p.size);
                } else if (p.type === 'heart') {
                    drawHeart(ctx, p.x, p.y, p.size);
                } else {
                    // Sparkle is just a circle
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
            ctx.globalAlpha = 1;

            if (!isFrozen) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            cancelAnimationFrame(animationFrame);
        };
    }, [isFrozen, performanceLevel]);

    if (isFrozen) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[9999]"
            style={{ mixBlendMode: 'screen' }}
        />
    );
};
