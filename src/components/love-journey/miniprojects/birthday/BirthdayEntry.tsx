'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
    ArrowLeft, AudioLines, ChevronLeft, ChevronRight,
    Heart, RotateCcw, VolumeX, X,
} from 'lucide-react';
import BirthdayIntro from './BirthdayIntro';
import type { BirthdaySceneId, BirthdayStory } from './birthday-story';
import { birthdayRelease } from './birthday-release';
import styles from './birthday.module.css';

const BirthdayScene = dynamic(() => import('./BirthdayScene'), { ssr: false });
const soundtrack = '/birthday/piano-waltz.wav';
type PhotoDirection = -1 | 1;
type PhotoTransition = { direction: PhotoDirection; phase: 'out' | 'in' };

function Star() {
    return (
        <svg aria-hidden="true" viewBox="0 0 32 32" fill="none">
            <path d="M16 1.5c0 8.9 5.6 14.5 14.5 14.5-8.9 0-14.5 5.6-14.5 14.5C16 21.6 10.4 16 1.5 16 10.4 16 16 10.4 16 1.5Z" fill="currentColor" />
            <path d="M5 5l3 3m19-3-3 3M5 27l3-3m19 3-3-3" stroke="currentColor" strokeLinecap="round" />
        </svg>
    );
}

function Observatory() {
    return (
        <svg className={styles.observatory} viewBox="0 0 600 465" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
                <linearGradient id="birthday-orbit" x2="0" y2="1">
                    <stop stopColor="#f3c392" stopOpacity=".68" />
                    <stop offset="1" stopColor="#b77162" stopOpacity=".06" />
                </linearGradient>
            </defs>
            <g fill="none" stroke="url(#birthday-orbit)">
                <circle cx="300" cy="231" r="171" />
                <circle cx="300" cy="231" r="154" strokeDasharray="1 6" />
                <circle cx="300" cy="231" r="133" opacity=".42" />
                <ellipse cx="300" cy="365" rx="191" ry="30" opacity=".45" />
                <ellipse cx="300" cy="365" rx="147" ry="20" opacity=".35" />
                <path d="M300 62v25m0 288v26M129 231h25m292 0h25M179 110l14 14m228-14-14 14M179 352l14-14m228 14-14-14" />
            </g>
            <g fill="#f8d0a2">
                <path d="M192 100q0 10 10 10-10 0-10 10 0-10-10-10 10 0 10-10Z" opacity=".8" />
                <path d="M438 132q0 15 15 15-15 0-15 15 0-15-15-15 15 0 15-15Z" opacity=".94" />
                <path d="M150 275q0 10 10 10-10 0-10 10 0-10-10-10 10 0 10-10Z" opacity=".69" />
                <path d="M474 291q0 7 7 7-7 0-7 7 0-7-7-7 7 0 7-7Z" opacity=".58" />
                {[[101, 171], [151, 154], [210, 155], [253, 78], [350, 106], [391, 93],
                    [488, 171], [474, 224], [520, 264], [387, 315], [103, 310], [215, 326], [333, 137],
                    [192, 208], [426, 221], [116, 232], [500, 113]].map(([x, y], index) => (
                    <circle key={x} cx={x} cy={y} r={index % 3 === 0 ? 1.8 : 1} opacity={index % 3 === 0 ? '.65' : '.43'} />
                ))}
            </g>
        </svg>
    );
}

function WishTrail() {
    return (
        <svg className={styles.wishTrail} viewBox="0 0 600 465" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <path className={styles.wishStreak} d="M294 126 C318 81 365 53 413 79 C447 98 447 112 477 119" pathLength="100" />
            <g className={styles.wishConstellation}>
                <path d="M477 119L491 105L507 103L519 117L514 134L477 164L441 134L435 117L447 103L463 105Z" pathLength="100" />
                <g fill="#ffe6c1">
                    <circle cx="477" cy="119" r="3.4" />
                    <circle cx="491" cy="105" r="1.9" />
                    <circle cx="507" cy="103" r="2.4" />
                    <circle cx="519" cy="117" r="1.9" />
                    <circle cx="514" cy="134" r="2.4" />
                    <circle cx="477" cy="164" r="2.9" />
                    <circle cx="441" cy="134" r="2.4" />
                    <circle cx="435" cy="117" r="1.9" />
                    <circle cx="447" cy="103" r="2.4" />
                    <circle cx="463" cy="105" r="1.9" />
                </g>
                <g className={styles.wishMotes}>
                    <circle cx="433" cy="89" r="1.6" />
                    <circle cx="495" cy="86" r="1.2" />
                    <circle cx="531" cy="139" r="1.7" />
                    <circle cx="459" cy="156" r="1.4" />
                    <circle cx="505" cy="158" r="1" />
                </g>
            </g>
        </svg>
    );
}

function KeepsakeStage({
    scene, photo, wished, opened, reduced, celebrating, photoTransition, onChangePhoto,
}: {
    scene: BirthdaySceneId;
    photo: BirthdayStory['memories'][number];
    wished: boolean;
    opened: boolean;
    reduced: boolean;
    celebrating: boolean;
    photoTransition: PhotoTransition | null;
    onChangePhoto: (direction: PhotoDirection) => void;
}) {
    const asset = scene === 'frame' ? photo.image : scene;
    const [readyAsset, setReadyAsset] = useState<string | null>(null);
    const ready = readyAsset === asset;
    const markReady = useCallback((value: boolean) => setReadyAsset(value ? asset : null), [asset]);
    const turn = useRef(0);
    const drag = useRef<{ pointer: number; x: number; rotation: number } | null>(null);

    const startDrag = (event: PointerEvent<HTMLDivElement>) => {
        if (!ready || reduced || photoTransition || !event.isPrimary || event.button !== 0) return;
        if (event.target instanceof Element && event.target.closest('button')) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { pointer: event.pointerId, x: event.clientX, rotation: turn.current };
    };

    const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
        if (drag.current?.pointer !== event.pointerId) return;
        turn.current = Math.max(-0.9, Math.min(0.9, drag.current.rotation + (event.clientX - drag.current.x) * 0.008));
    };

    return (
        <div
            className={styles.stage}
            data-ready={ready}
            data-scene={scene}
            data-wished={scene === 'cake' && wished}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onLostPointerCapture={() => { drag.current = null; }}
        >
            <Observatory />
            {scene === 'cake' && <span className={styles.candleHalo} aria-hidden="true" />}
            <span className={styles.corners} aria-hidden="true" />
            {scene === 'frame' ? (
                <div className={styles.stageHeading} role="group" aria-label="Chọn ảnh kỷ niệm">
                    <button className={styles.frameArrow} type="button" aria-label="Ảnh trước" aria-disabled={!!photoTransition} onClick={() => onChangePhoto(-1)}>
                        <ChevronLeft size={17} aria-hidden="true" />
                    </button>
                    <span className={styles.stageLabel}>VẬT KỶ NIỆM</span>
                    <button className={styles.frameArrow} type="button" aria-label="Ảnh tiếp" aria-disabled={!!photoTransition} onClick={() => onChangePhoto(1)}>
                        <ChevronRight size={17} aria-hidden="true" />
                    </button>
                    <span className="sr-only" aria-live="polite">{photo.alt}</span>
                </div>
            ) : <span className={styles.stageKicker}><Star /> VẬT KỶ NIỆM <Star /></span>}
            <div className={styles.floor} aria-hidden="true" />
            <div
                className={styles.keepsakeObject}
                data-transition={photoTransition?.phase}
                data-direction={photoTransition?.direction === -1 ? 'previous' : undefined}
                aria-hidden="true"
            >
                <div className={styles.poster}>
                    {scene === 'frame' ? (
                        <div className={styles.photoPoster} data-frame={photo.frame}>
                            {/* The same photograph is used as a texture in the 3D frame. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo.image} alt="" style={{ objectPosition: `${photo.focusX * 100}% center` }} />
                        </div>
                    ) : scene === 'cake' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className={styles.cakePoster} src={wished ? '/birthday/cake-citrus-unlit.webp?v=heart' : '/birthday/cake-citrus-lit.webp?v=heart'} alt="" />
                    ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src="/birthday/envelope.svg" alt="" />
                    )}
                </div>
                <div className={styles.canvas}>
                    <BirthdayScene
                        scene={scene}
                        memory={photo}
                        wished={wished}
                        opened={opened}
                        reduced={reduced}
                        turn={turn}
                        onReady={markReady}
                    />
                </div>
            </div>
            {celebrating && <WishTrail />}
            <span className={styles.stageCredit} aria-hidden="true">✧</span>
        </div>
    );
}

export default function BirthdayEntry({ story }: { story: BirthdayStory }) {
    const { chapters: birthdayChapters, memories: birthdayMemories, letter: birthdayLetter } = story;
    const [intro, setIntro] = useState<'ready' | 'loading' | 'playing' | 'done'>('ready');
    const [chapterIndex, setChapterIndex] = useState(0);
    const [photoIndex, setPhotoIndex] = useState(0);
    const [photoTransition, setPhotoTransition] = useState<PhotoTransition | null>(null);
    const [wished, setWished] = useState(false);
    const [celebrating, setCelebrating] = useState(false);
    const [opened, setOpened] = useState(false);
    const [opening, setOpening] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [audioFailed, setAudioFailed] = useState(false);
    const reduced = useReducedMotion() ?? false;
    const audio = useRef<HTMLAudioElement>(null);
    const letter = useRef<HTMLDialogElement>(null);
    const heading = useRef<HTMLHeadingElement>(null);
    const wishButton = useRef<HTMLButtonElement>(null);
    const chapter = birthdayChapters[chapterIndex];
    const photo = birthdayMemories[photoIndex];

    useEffect(() => {
        if (intro === 'done') {
            heading.current?.focus();
            return;
        }
        if (intro === 'ready') return;

        // Continue even if audio stalls or the browser cancels the last animation.
        const delay = intro === 'loading' ? 1600 : reduced ? 1600 : 12400;
        const timer = window.setTimeout(
            () => setIntro(intro === 'loading' ? 'playing' : 'done'),
            delay,
        );
        return () => window.clearTimeout(timer);
    }, [intro, reduced]);

    useEffect(() => {
        if (!celebrating) return;
        const timer = window.setTimeout(() => setCelebrating(false), 2400);
        return () => window.clearTimeout(timer);
    }, [celebrating]);

    useEffect(() => {
        if (!opening) return;
        const timer = window.setTimeout(() => {
            letter.current?.showModal();
            setOpening(false);
        }, 600);
        return () => window.clearTimeout(timer);
    }, [opening]);

    useEffect(() => {
        if (!photoTransition) return;
        const { direction, phase } = photoTransition;
        const delay = reduced ? 0 : phase === 'out' ? 180 : 300;
        const timer = window.setTimeout(() => {
            if (phase === 'out') {
                setPhotoIndex(current => (current + direction + birthdayMemories.length) % birthdayMemories.length);
                setPhotoTransition({ direction, phase: 'in' });
            } else {
                setPhotoTransition(null);
            }
        }, delay);
        return () => window.clearTimeout(timer);
    }, [photoTransition, reduced, birthdayMemories.length]);

    const goToChapter = (index: number, focus = false) => {
        setCelebrating(false);
        setOpening(false);
        setPhotoTransition(null);
        setChapterIndex(index);
        if (index === 1) {
            void import('./BirthdayScene').then(({ preloadBirthdayMemories }) => preloadBirthdayMemories(birthdayMemories), () => {});
        }
        if (focus) requestAnimationFrame(() => heading.current?.focus());
    };

    const changePhoto = (direction: PhotoDirection) => {
        if (photoTransition) return;
        if (reduced) {
            setPhotoIndex(current => (current + direction + birthdayMemories.length) % birthdayMemories.length);
        } else {
            setPhotoTransition({ direction, phase: 'out' });
        }
    };

    const toggleSound = async () => {
        const track = audio.current;
        if (!track) return;
        setAudioFailed(false);
        if (!track.paused) {
            track.pause();
            return;
        }
        try {
            track.volume = 0.25;
            await track.play();
        } catch (error) {
            if (!(error instanceof DOMException && error.name === 'AbortError')) setAudioFailed(true);
        }
    };

    const openGift = () => {
        if (intro !== 'ready') return;
        setIntro('loading');
        void import('./BirthdayScene').then(({ preloadBirthdayCake }) => preloadBirthdayCake(), () => {});
        void toggleSound().then(() => {
            setIntro(current => current === 'loading' ? 'playing' : current);
        });
    };

    const readLetter = () => {
        if (opening) return;
        if (opened || reduced) letter.current?.showModal();
        else setOpening(true);
        setOpened(true);
    };

    const blowOut = () => {
        if (celebrating) return;
        if (wished) {
            goToChapter(1, true);
            return;
        }
        setWished(true);
        setCelebrating(!reduced);
    };

    const restart = () => {
        letter.current?.close();
        setWished(false);
        setOpened(false);
        setPhotoIndex(0);
        goToChapter(0, true);
    };

    const gift = (
        <>
            {celebrating && <span className={styles.wishVignette} aria-hidden="true" />}
            <div className={styles.shell}>
                <header className={styles.header}>
                    <Link className={styles.brand} href="/dashboard" aria-label="Về HeartScript">
                        <span className={styles.mark}><Star /></span>
                        <span>HeartScript <small>QUÀ SINH NHẬT</small></span>
                    </Link>
                    <p className={styles.edition}>LƯU BÚT <span>✧</span> <time dateTime={birthdayRelease}>07 THÁNG 11</time></p>
                    <div className={styles.soundGroup}>
                        <button
                            type="button"
                            className={styles.sound}
                            aria-pressed={playing}
                            onClick={toggleSound}
                            aria-label={playing ? 'Tắt nhạc' : 'Bật nhạc'}
                        >
                            {playing ? <AudioLines size={15} /> : <VolumeX size={15} />}
                            <span>{playing ? 'Tắt nhạc' : 'Bật nhạc'}</span>
                        </button>
                        {audioFailed && <span className={styles.soundError} role="status">Chưa phát được nhạc.</span>}
                    </div>
                </header>

                <section className={styles.hero} aria-labelledby="birthday-title">
                    <div className={styles.intro}>
                        <div className={styles.kicker} key={chapter.id}>
                            <span aria-hidden="true" /> {chapter.label}
                        </div>
                        <h1 id="birthday-title" className={styles.title} ref={heading} tabIndex={-1}>
                            {chapter.title[0]} <em>{chapter.title[1]}</em>
                        </h1>
                        {chapter.description && <p className={styles.description}>{chapter.description}</p>}
                    </div>

                    <div className={styles.figure}>
                        <KeepsakeStage
                            key={chapter.id}
                            scene={chapter.id}
                            photo={photo}
                            wished={wished}
                            opened={opened}
                            reduced={reduced}
                            celebrating={celebrating}
                            photoTransition={photoTransition}
                            onChangePhoto={changePhoto}
                        />
                        <div className={styles.actions}>
                            {chapter.id === 'cake' && (
                                <div className={styles.wishActions}>
                                    <button
                                        ref={wishButton}
                                        className={styles.primary}
                                        onClick={blowOut}
                                        aria-disabled={celebrating}
                                    >
                                        {wished && !celebrating ? 'Xem kỷ niệm' : 'Thổi nến'}
                                    </button>
                                    {wished && !celebrating && (
                                        <button
                                            className={styles.relight}
                                            aria-label="Thắp lại nến"
                                            title="Thắp lại nến"
                                            onClick={() => {
                                                wishButton.current?.focus();
                                                setWished(false);
                                            }}
                                        >
                                            <RotateCcw size={16} aria-hidden="true" />
                                        </button>
                                    )}
                                </div>
                            )}
                            {chapter.id === 'frame' && (
                                <button className={styles.primary} onClick={() => goToChapter(2, true)}>Tới lá thư</button>
                            )}
                            {chapter.id === 'envelope' && (
                                <>
                                    <button className={styles.primary} onClick={readLetter} aria-disabled={opening}>
                                        {opening ? 'Đang mở…' : opened ? 'Đọc lại thư' : 'Mở thư'}
                                    </button>
                                    <button className={styles.textButton} onClick={restart}><RotateCcw size={14} /> Xem lại từ đầu</button>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                <footer className={styles.footer}>
                    <span>Nhật ký của hai đứa.</span>
                    <Heart size={12} aria-hidden="true" />
                    <span>HEARTSCRIPT · 07.11</span>
                </footer>
            </div>

            <dialog className={styles.letter} ref={letter} aria-labelledby="birthday-letter-title">
                <article>
                    <button className={styles.letterClose} onClick={() => letter.current?.close()} aria-label="Đóng thư"><X size={20} /></button>
                    <span className={styles.letterSeal}><Heart size={17} strokeWidth={1.5} aria-hidden="true" /></span>
                    <p className={styles.letterKicker}>THƯ SINH NHẬT <span>·</span> <time dateTime={birthdayRelease}>07 THÁNG 11</time></p>
                    <h2 id="birthday-letter-title">{birthdayLetter.greeting}</h2>
                    {birthdayLetter.paragraphs.map(paragraph => <p className={styles.letterText} key={paragraph}>{paragraph}</p>)}
                    <p className={styles.signature}>{birthdayLetter.signature}</p>
                    <button className={styles.letterBack} onClick={() => letter.current?.close()}>
                        <ArrowLeft size={15} /> Gấp thư lại
                    </button>
                </article>
            </dialog>
        </>
    );

    return (
        <main className={styles.page} lang="vi">
            <audio
                ref={audio} src={soundtrack} loop preload="auto"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onError={() => { setPlaying(false); setAudioFailed(true); }}
            />
            {intro === 'done' ? gift : (
                <BirthdayIntro
                    loading={intro === 'loading'}
                    playing={intro === 'playing'}
                    onOpen={openGift}
                    onComplete={() => setIntro('done')}
                />
            )}
        </main>
    );
}
