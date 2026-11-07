'use client';

import { FirebaseError } from 'firebase/app';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { ArrowRight, ArrowUpRight, Heart, LoaderCircle } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { createSession } from '@/app/actions/auth';
import { birthdayPath, dashboardPath } from '@/lib/auth-destination';
import { ALLOWED_EMAILS, HIM_EMAILS } from '@/lib/constants';
import { auth } from '@/lib/firebase';
import styles from './login.module.css';

type Role = 'him' | 'her';
type LoginError = { message: string; retryUrl?: string };

function loginError(error: unknown): LoginError {
    if (error instanceof FirebaseError) {
        switch (error.code) {
            case 'auth/unauthorized-domain': {
                const url = new URL(window.location.href);
                if (url.hostname === '127.0.0.1' || url.hostname === '[::1]') {
                    url.hostname = 'localhost';
                    return { message: 'Firebase chưa cho phép đăng nhập từ địa chỉ này.', retryUrl: url.href };
                }
                return { message: 'Firebase chưa cho phép đăng nhập từ tên miền này.' };
            }
            case 'auth/popup-blocked':
                return { message: 'Trình duyệt đã chặn cửa sổ đăng nhập. Cho phép popup rồi thử lại nhé.' };
            case 'auth/popup-closed-by-user':
                return { message: 'Cửa sổ Google đã đóng trước khi đăng nhập xong. Bạn thử lại nhé.' };
        }
    }
    return { message: 'Chưa đăng nhập được. Bạn thử lại nhé.' };
}

function Mascot({ role }: { role: Role }) {
    const orange = role === 'him';
    return (
        <svg className={styles.mascot} viewBox="0 0 160 126" aria-hidden="true" fill="none">
            <defs>
                <radialGradient id={orange ? 'cam-skin' : 'dau-skin'} cx=".36" cy=".27" r=".72">
                    <stop stopColor={orange ? '#ffd083' : '#ffb6b4'} />
                    <stop offset="1" stopColor={orange ? '#e9874b' : '#db627c'} />
                </radialGradient>
            </defs>
            <ellipse cx="80" cy="113" rx="47" ry="5" fill={orange ? '#b7775b' : '#b5697f'} opacity=".17" />
            <path d="M58 100l-4 9m47-9 4 9M40 76q-10 1-11-7m91 7q10-1 11-9" stroke={orange ? '#bc774d' : '#b94f68'} strokeWidth="3.6" strokeLinecap="round" />
            {orange ? (
                <>
                    <path d="M81 36q-5-13-1-20" stroke="#886346" strokeWidth="4" strokeLinecap="round" />
                    <path d="M81 27c6-16 21-19 33-15-5 13-19 20-33 15Z" fill="#628572" />
                    <path d="M86 25c7-5 15-9 23-11" stroke="#b9c59d" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M80 30c24-4 43 15 43 38 0 24-18 39-43 39-25 0-43-15-43-39 0-23 18-42 43-38Z" fill="url(#cam-skin)" stroke="#d68a56" strokeWidth="1.3" />
                    <path d="M49 55q4-11 17-16" stroke="#fff3cf" strokeWidth="3" strokeLinecap="round" opacity=".64" />
                    <g fill="#b16c4e" opacity=".35"><circle cx="58" cy="48" r="1"/><circle cx="53" cy="57" r="1"/><circle cx="109" cy="85" r="1.3"/><circle cx="103" cy="91" r="1"/><circle cx="111" cy="91" r=".9"/><circle cx="97" cy="96" r=".9"/></g>
                </>
            ) : (
                <>
                    <path d="M80 41c22-14 46-2 43 24-2 18-23 44-43 44-20 0-41-26-43-44-3-26 21-38 43-24Z" fill="url(#dau-skin)" stroke="#d36a81" strokeWidth="1.3" />
                    <path d="M80 39c1-8 4-14 11-18" stroke="#506d5d" strokeWidth="3.6" strokeLinecap="round" />
                    <path d="M80 41c-10-14-24-12-30-7 5 8 13 11 24 11l-5 7c5 2 9-1 12-5 4 5 10 7 15 4l-7-6c10 1 17-4 20-11-13-4-23-1-29 7Z" fill="#658776" />
                    <g stroke="#fff0c3" strokeWidth="2.1" strokeLinecap="round"><path d="m52 52 1 3m52-3-1 3M49 65l1 2m60-2-1 2M56 85l1 2m46-2-1 2M72 96l1 2m15-2-1 2"/></g>
                </>
            )}
            <ellipse cx="57" cy="77" rx="6" ry="3.7" fill={orange ? '#dd775f' : '#bc4e70'} opacity=".45" />
            <ellipse cx="103" cy="77" rx="6" ry="3.7" fill={orange ? '#dd775f' : '#bc4e70'} opacity=".45" />
            <g fill="#4d3337"><ellipse cx="67" cy="68" rx="2.7" ry="4"/><ellipse cx="93" cy="68" rx="2.7" ry="4"/></g>
            <path d="M76 75q4 6 8 0" stroke="#6d3f43" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M25 38v10m-5-5h10m104-10v8m-4-4h8" stroke={orange ? '#b97c49' : '#b46481'} opacity=".55" strokeLinecap="round" />
        </svg>
    );
}

function ProfileArt({ role }: { role: Role }) {
    const [artUnavailable, setArtUnavailable] = useState(false);

    return (
        <span className={styles.art} aria-hidden="true">
            {artUnavailable ? <Mascot role={role} /> : (
                <Image
                    className={styles.charm}
                    src={role === 'him' ? '/heart-glass/orange.webp' : '/heart-glass/strawberry.webp'}
                    alt=""
                    width={544}
                    height={544}
                    sizes="(max-width: 540px) 30vw, (max-width: 900px) 21vw, 220px"
                    loading="eager"
                    onError={() => setArtUnavailable(true)}
                />
            )}
        </span>
    );
}

const profiles = [
    { role: 'him', name: 'Anh' },
    { role: 'her', name: 'Em' },
] as const;

export default function LoginScreen({ destination = dashboardPath }: { destination?: string }) {
    const [pending, setPending] = useState<Role | null>(null);
    const [error, setError] = useState<LoginError | null>(null);

    async function signIn(role: Role) {
        if (pending) return;
        setPending(role);
        setError(null);
        try {
            let user = auth.currentUser;
            const email = user?.email;
            const matchesRole = email && ALLOWED_EMAILS.includes(email) && (HIM_EMAILS.includes(email) === (role === 'him'));
            if (!user || !matchesRole) {
                const provider = new GoogleAuthProvider();
                provider.setCustomParameters({ prompt: 'select_account' });
                ({ user } = await signInWithPopup(auth, provider));
            }
            if (!user.email || !ALLOWED_EMAILS.includes(user.email)) {
                await auth.signOut();
                setError({ message: 'Tài khoản Google này chưa có quyền truy cập.' });
                return;
            }
            if (!await createSession(await user.getIdToken())) {
                await auth.signOut();
                setError({ message: 'Chưa xác nhận được phiên đăng nhập. Bạn thử lại nhé.' });
                return;
            }
            window.location.replace(destination);
        } catch (cause) {
            setError(loginError(cause));
        } finally {
            setPending(null);
        }
    }

    const isBirthday = destination === birthdayPath;

    return (
        <main className={styles.page} lang="vi">
            <div className={styles.brand}><Heart size={16} strokeWidth={1.5} aria-hidden="true" /> HeartScript</div>
            <div className={styles.sheet}>
                {isBirthday ? (
                    <h1 className={styles.heading}>Quà <em>sinh nhật</em></h1>
                ) : <h1 className="sr-only">Đăng nhập</h1>}
                <div className={styles.profiles}>
                    {profiles.map(({ role, name }) => (
                        <button key={role} type="button" aria-label={`Đăng nhập: ${name}`} aria-busy={pending === role}
                            disabled={!!pending} className={`heart-glass-surface ${styles.profile}`} data-role={role} onClick={() => signIn(role)}>
                            <ProfileArt role={role} />
                            <span className={styles.profileName}>{name}</span>
                            <span className={`heart-glass-surface ${styles.arrow}`} aria-hidden="true">
                                {pending === role ? <LoaderCircle className={styles.spinner} size={18} /> : <ArrowRight size={18} strokeWidth={1.6} />}
                            </span>
                        </button>
                    ))}
                </div>
                <p className="sr-only" role="status">{pending ? 'Đang đăng nhập…' : ''}</p>
                {error && (
                    <div role="alert" className={`heart-glass-surface ${styles.error}`}>
                        {error.message}
                        {error.retryUrl && <a className="heart-glass-button" href={error.retryUrl}>Mở bằng localhost <ArrowUpRight size={14} aria-hidden="true" /></a>}
                    </div>
                )}
            </div>
        </main>
    );
}
