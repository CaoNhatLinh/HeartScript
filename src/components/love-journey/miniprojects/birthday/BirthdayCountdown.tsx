'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkle } from 'lucide-react';
import { birthdayRelease, birthdayUnlockAt } from './birthday-release';
import styles from './birthday.module.css';

const units = [
    { label: 'Ngày', seconds: 86400 },
    { label: 'Giờ', seconds: 3600 },
    { label: 'Phút', seconds: 60 },
    { label: 'Giây', seconds: 1 },
];

function secondsUntilRelease(now: number) {
    return Math.max(0, Math.ceil((birthdayUnlockAt - now) / 1000));
}

export default function BirthdayCountdown({ serverNow }: { serverNow: number }) {
    const router = useRouter();
    const [remaining, setRemaining] = useState(() => secondsUntilRelease(serverNow));
    const nextCheck = useRef(0);

    useEffect(() => {
        // Keep the displayed time independent of the phone's date and timezone.
        const start = performance.now();
        const sync = () => {
            const now = performance.now();
            if (document.visibilityState !== 'visible' || now < nextCheck.current) return;
            nextCheck.current = now + 1000;
            router.refresh();
        };
        const tick = () => {
            const seconds = secondsUntilRelease(serverNow + performance.now() - start);
            setRemaining(seconds);
            if (seconds <= 1) sync();
        };
        const timer = window.setInterval(tick, 200);
        const resync = window.setInterval(sync, 300_000);
        document.addEventListener('visibilitychange', sync);
        return () => {
            window.clearInterval(timer);
            window.clearInterval(resync);
            document.removeEventListener('visibilitychange', sync);
        };
    }, [router, serverNow]);

    return (
        <main className={`${styles.page} ${styles.waiting}`} lang="vi">
            <svg className={styles.countdownDial} viewBox="0 0 800 800" aria-hidden="true">
                <g fill="none" stroke="currentColor">
                    <circle cx="400" cy="400" r="355" opacity=".28" />
                    <circle cx="400" cy="400" r="333" pathLength="120" strokeDasharray=".25 .75" opacity=".58" />
                    <circle cx="400" cy="400" r="315" opacity=".24" />
                    <circle cx="400" cy="400" r="288" opacity=".17" />
                    <path d="M400 45v47m0 616v47M45 400h47m616 0h47M149 149l28 28m446 446 28 28M651 149l-28 28M177 623l-28 28" opacity=".38" />
                    <g className={styles.countdownOrbit}>
                        <path d="M78 250A355 355 0 0 1 526 68M722 550A355 355 0 0 1 274 732" opacity=".74" />
                        <circle cx="78" cy="250" r="4" fill="currentColor" />
                        <circle cx="722" cy="550" r="4" fill="currentColor" />
                    </g>
                </g>
                <g fill="currentColor">
                    <path d="M400 34Q400 45 411 45Q400 45 400 56Q400 45 389 45Q400 45 400 34Z" />
                    <path d="M400 748Q400 755 407 755Q400 755 400 762Q400 755 393 755Q400 755 400 748Z" />
                    <path d="M194 215Q194 223 202 223Q194 223 194 231Q194 223 186 223Q194 223 194 215ZM624 549Q624 557 632 557Q624 557 624 565Q624 557 616 557Q624 557 624 549Z" opacity=".75" />
                    <path d="M120 199h2v2h-2zm438-22h3v3h-3zm-83-56h2v2h-2zM279 628h3v3h-3zm211 51h2v2h-2zm197-77h2v2h-2z" opacity=".52" />
                </g>
            </svg>
            <section className={styles.countdown} aria-label="Đếm ngược đến sinh nhật">
                <div className={styles.countdownCrest} aria-hidden="true">
                    <span className={styles.countdownMark}><Sparkle size={25} strokeWidth={1.25} /></span>
                </div>
                <time dateTime={birthdayRelease} className={styles.countdownDate}>00:00 · 07/11/2026 · GIỜ VIỆT NAM</time>
                <div className={styles.countdownGrid} role="timer" aria-live="off">
                    {units.map(({ label, seconds }, index) => {
                        const value = Math.floor(remaining / seconds);
                        const part = index === 0 ? value : value % (units[index - 1].seconds / seconds);
                        return (
                            <div className={styles.countdownPart} key={label}>
                                <span className={styles.countdownValue} key={part}>{String(part).padStart(2, '0')}</span>
                                <small>{label}</small>
                            </div>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}
