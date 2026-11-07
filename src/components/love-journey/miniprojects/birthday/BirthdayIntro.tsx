'use client';

import { ArrowRight, Gift } from 'lucide-react';
import OrangeDelivery from './OrangeDelivery';
import styles from './birthday.module.css';

export default function BirthdayIntro({
    loading, playing, onOpen, onComplete,
}: {
    loading: boolean;
    playing: boolean;
    onOpen: () => void;
    onComplete: () => void;
}) {
    return (
        <section className={styles.prelude} aria-label="Mở quà sinh nhật">
            <div className={styles.preludeCard}>
                <svg
                    className={playing ? `${styles.preludeArt} ${styles.preludePlaying}` : styles.preludeArt}
                    viewBox="0 0 600 390"
                    role="img"
                    aria-label={playing ? 'Cam ôm hộp quà đến, suýt đánh rơi, rồi mở hộp để lộ bánh sinh nhật trước khi Dâu xuất hiện' : 'Một hộp quà sinh nhật'}
                    onAnimationEnd={event => {
                        if (playing && event.target === event.currentTarget) onComplete();
                    }}
                >
                    <defs>
                        <radialGradient id="prelude-night" cx=".5" cy=".46" r=".68">
                            <stop stopColor="#67404d" />
                            <stop offset="1" stopColor="#241927" />
                        </radialGradient>
                        <linearGradient id="prelude-icing" x2="0" y2="1">
                            <stop stopColor="#ffe5c4" />
                            <stop offset="1" stopColor="#e6aa9e" />
                        </linearGradient>
                        <radialGradient id="prelude-glow">
                            <stop stopColor="#ffd28d" stopOpacity=".47" />
                            <stop offset="1" stopColor="#ffb772" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <rect width="600" height="390" fill="url(#prelude-night)" />
                    <rect x="10" y="10" width="580" height="370" rx="2" fill="none" stroke="#e9b88a" opacity=".31" />
                    <g className={playing ? styles.deliveryCamera : undefined}>
                        <g fill="none" stroke="#e8b183">
                            <circle cx="300" cy="194" r="133" opacity=".36" />
                            <circle cx="300" cy="194" r="119" strokeDasharray="1 5" opacity=".48" />
                            <ellipse cx="300" cy="317" rx="181" ry="19" opacity=".31" />
                            <path d="M300 53v17m0 248v17M158 194h17m250 0h17" opacity=".46" />
                        </g>
                        <g fill="#f0c89a">
                            <path d="M164 123q0 8 8 8-8 0-8 8 0-8-8-8 8 0 8-8Zm278 76q0 7 7 7-7 0-7 7 0-7-7-7 7 0 7-7Z" />
                            <path d="M116 192h2v2h-2zm96-94h3v3h-3zm269 65h2v2h-2zm-39-73h2v2h-2zm-289 171h3v3h-3zm319 8h2v2h-2z" opacity=".56" />
                        </g>
                        <ellipse cx="302" cy="313" rx="117" ry="13" fill="#201221" opacity=".49" />
                        {playing ? <OrangeDelivery /> : (
                            <g stroke="#b9797f" strokeWidth="2" strokeLinejoin="round">
                                <rect x="221" y="190" width="158" height="115" rx="5" fill="url(#prelude-icing)" />
                                <rect x="213" y="175" width="174" height="31" rx="4" fill="#edbbab" />
                                <path d="M288 175h24v130h-24z" fill="#f5d59f" />
                                <path d="M300 175c-31 1-58-18-47-34 9-14 28-7 47 34Zm0 0c31 1 58-18 47-34-9-14-28-7-47 34Z" fill="#efc785" />
                                <circle cx="300" cy="174" r="7" fill="#ffe3ae" />
                            </g>
                        )}
                    </g>
                </svg>
                <button className={styles.primary} aria-disabled={loading || playing} onClick={onOpen} style={{ visibility: playing ? 'hidden' : undefined }}>
                    <Gift size={17} aria-hidden="true" /> {loading ? 'Đang mở…' : 'Mở quà'} <ArrowRight size={17} className={styles.buttonArrow} aria-hidden="true" />
                </button>
            </div>
        </section>
    );
}
