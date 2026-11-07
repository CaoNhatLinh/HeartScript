'use client';

import { differenceInCalendarDays, format, intervalToDuration, isValid, parseISO } from 'date-fns';
import { onValue, ref, set } from 'firebase/database';
import { ArrowRight, Check, Heart, Loader2, Settings, Sparkle, X } from 'lucide-react';
import { useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { rtdb } from '@/lib/firebase';
import styles from './welcome.module.css';

const vietnamCalendar = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

function vietnamToday() {
    const parts = Object.fromEntries(vietnamCalendar.formatToParts(new Date()).map(({ type, value }) => [type, value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
}

function isDate(value: unknown): value is string {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value));
}

export function WelcomeSection() {
    const [startDate, setStartDate] = useState<string | null>(null);
    const [today, setToday] = useState(vietnamToday);
    const [draft, setDraft] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveFailed, setSaveFailed] = useState(false);

    useEffect(() => {
        const unsubscribe = onValue(ref(rtdb, 'settings/loveStartDate'), snapshot => {
            const value = snapshot.val();
            setStartDate(isDate(value) ? value : null);
        });
        const timer = window.setInterval(() => setToday(vietnamToday()), 30_000);
        return () => {
            unsubscribe();
            window.clearInterval(timer);
        };
    }, []);

    const start = startDate ? parseISO(startDate) : null;
    const end = parseISO(today);
    const canCount = start !== null && start <= end;
    const duration = canCount ? intervalToDuration({ start, end }) : {};
    const totalDays = canCount ? differenceInCalendarDays(end, start) + 1 : 0;
    const periods = [
        { label: 'Năm', amount: duration.years ?? 0 },
        { label: 'Tháng', amount: duration.months ?? 0 },
        { label: 'Ngày', amount: duration.days ?? 0 },
    ];

    const saveDate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isDate(draft) || saving) return;
        setSaving(true);
        setSaveFailed(false);
        try {
            await set(ref(rtdb, 'settings/loveStartDate'), draft);
            setIsEditing(false);
        } catch {
            setSaveFailed(true);
        } finally {
            setSaving(false);
        }
    };

    const explore = (event: MouseEvent<HTMLButtonElement>) => {
        const container = event.currentTarget.closest('.snap-x');
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        container?.scrollBy({ left: container.clientWidth, behavior: reduced ? 'instant' : 'smooth' });
    };

    return (
        <section className={styles.welcome} aria-labelledby="together-title" lang="vi">
            <div className={styles.setting}>
                <button
                    type="button"
                    className={styles.settingsButton}
                    aria-label="Chỉnh ngày bắt đầu"
                    aria-expanded={isEditing}
                    onClick={() => {
                        setDraft(startDate ?? '');
                        setSaveFailed(false);
                        setIsEditing(value => !value);
                    }}
                >
                    <Settings size={18} strokeWidth={1.65} aria-hidden="true" />
                </button>
                {isEditing && (
                    <form className={styles.dateForm} onSubmit={saveDate}>
                        <label htmlFor="love-start-date">Ngày bắt đầu</label>
                        <div>
                            <Input id="love-start-date" type="date" value={draft} onChange={event => setDraft(event.target.value)} required />
                            <Button type="submit" size="icon" disabled={!isDate(draft) || saving} aria-label="Lưu ngày bắt đầu">
                                {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
                            </Button>
                            <Button type="button" size="icon" variant="ghost" aria-label="Đóng chỉnh ngày" onClick={() => setIsEditing(false)}>
                                <X aria-hidden="true" />
                            </Button>
                        </div>
                        {saveFailed && <p role="alert">Chưa lưu được ngày. Bạn thử lại nhé.</p>}
                    </form>
                )}
            </div>

            <div className={styles.story}>
                <div className={styles.emblem} aria-hidden="true">
                    <Sparkle className={styles.sparkLeft} size={17} strokeWidth={1.4} />
                    <Heart className={styles.heart} size={30} strokeWidth={1.35} />
                    <Sparkle className={styles.sparkRight} size={13} strokeWidth={1.4} />
                </div>
                <div className={styles.heading}>
                    <p>Nhật ký hai đứa</p>
                    <h1 id="together-title">Bên <em>nhau</em></h1>
                </div>

                <dl className={styles.periods} aria-label="Thời gian bên nhau">
                    {periods.map(({ label, amount }) => (
                        <div key={label}>
                            <dt>{label}</dt>
                            <dd>{startDate ? String(amount).padStart(2, '0') : '—'}</dd>
                        </div>
                    ))}
                </dl>

                {start && startDate && (
                    <p className={styles.since}>
                        Từ <time dateTime={startDate}>{format(start, 'dd.MM.yyyy')}</time>
                        <span aria-hidden="true">·</span>
                        <span><strong>{totalDays.toLocaleString('vi-VN')}</strong> ngày bên nhau</span>
                    </p>
                )}
                <button type="button" className={styles.explore} onClick={explore}>
                    Khám phá tiếp <ArrowRight size={16} aria-hidden="true" />
                </button>
            </div>
        </section>
    );
}
