import styles from './birthday.module.css';

export default function OrangeDelivery() {
    return (
        <g>
            <defs>
                <radialGradient id="delivery-orange" cx=".3" cy=".22" r=".85">
                    <stop stopColor="#ffdc8b" />
                    <stop offset=".57" stopColor="#ffb456" />
                    <stop offset="1" stopColor="#df7d41" />
                </radialGradient>
                <linearGradient id="delivery-leaf" x2=".8" y2="1">
                    <stop stopColor="#c9dc8d" />
                    <stop offset="1" stopColor="#64865c" />
                </linearGradient>
                <linearGradient id="delivery-ribbon" x2="1" y2="1">
                    <stop stopColor="#ffe7ac" />
                    <stop offset="1" stopColor="#dc9f65" />
                </linearGradient>
                <radialGradient id="delivery-berry" cx=".3" cy=".25" r=".9">
                    <stop stopColor="#ffa9a1" />
                    <stop offset=".61" stopColor="#e97b82" />
                    <stop offset="1" stopColor="#ad526d" />
                </radialGradient>
            </defs>
            <g className={styles.deliveryWalk}>
                <g className={styles.deliveryDust} fill="#e8b6a0">
                    <path d="M105 304c-3-5 2-10 9-8 2-7 14-8 18-2 8-3 17 2 16 8-2 6-18 7-31 6-6 0-10-1-12-4Z" />
                    <path d="M145 309c-4-4 1-9 7-7 1-6 11-8 16-3 8-1 11 7 3 10-6 3-19 3-26 0Z" />
                    <ellipse cx="85" cy="300" rx="9" ry="3" opacity=".57" />
                    <ellipse cx="131" cy="313" rx="12" ry="3" opacity=".65" />
                    <circle cx="96" cy="289" r="2.7" opacity=".66" />
                    <circle cx="150" cy="290" r="2.2" opacity=".7" />
                </g>
                <ellipse cx="228" cy="313" rx="73" ry="11" fill="#1d111d" opacity=".46" />
                <g transform="translate(228 239)">
                    <g fill="#e89952" stroke="#965240" strokeWidth="2.3" strokeLinejoin="round">
                        <path className={styles.deliveryFootLeft} d="M-37 49q14-4 23 5l-4 19q-11 7-24 1-5-4 5-25Z" />
                        <path className={styles.deliveryFootRight} d="M12 54q12-7 21 0l7 16q1 10-22 7-7-1-6-23Z" />
                    </g>
                    <g className={styles.deliveryBody}>
                        <path className={styles.deliveryArmLeft} d="M-50 15q-17-4-30 9-5 5-3 10 4 5 10 0 9-9 21-6Z" fill="#f5a85d" stroke="#9f5744" strokeWidth="2.3" strokeLinejoin="round" />
                        <path d="M-9-53q5-21 18-34" fill="none" stroke="#628256" strokeWidth="6" strokeLinecap="round" />
                        <path d="M-11-54q-24 2-38-13-9-10-6-17 8-8 27-2 17 7 17 32Z" fill="url(#delivery-leaf)" stroke="#55765a" strokeWidth="2.1" />
                        <path d="M-44-79q19 6 29 21" fill="none" stroke="#dee7a1" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M-61 3C-62-31-41-55-9-58 25-62 53-42 59-9 66 25 53 52 24 62-3 71-38 63-52 42-59 32-62 19-61 3Z" fill="url(#delivery-orange)" stroke="#9f5744" strokeWidth="2.7" />
                        <path d="M-50-13q4-21 24-30" fill="none" stroke="#ffe5aa" strokeWidth="3.6" strokeLinecap="round" opacity=".68" />
                        <g fill="#b46b45" opacity=".36">
                            <circle cx="-42" cy="-4" r="1.6" /><circle cx="-48" cy="3" r="1.2" />
                            <circle cx="-37" cy="5" r="1.2" /><circle cx="43" cy="-20" r="1.5" />
                            <circle cx="48" cy="-13" r="1.1" /><circle cx="39" cy="-13" r="1" />
                        </g>
                        <ellipse cx="-28" cy="23" rx="11" ry="5.4" fill="#ee8a7a" opacity=".81" />
                        <ellipse cx="39" cy="23" rx="10" ry="5.5" fill="#ec8474" opacity=".76" />
                        <g className={styles.deliveryEyes}>
                            <ellipse cx="-11" cy="0" rx="13.3" ry="15.8" fill="#fff3d8" />
                            <ellipse cx="19" cy="-1" rx="14.8" ry="16.4" fill="#fff3d8" />
                            <ellipse cx="-6.4" cy="2" rx="6.2" ry="8" fill="#512c34" />
                            <ellipse cx="24.2" cy="1.6" rx="6.6" ry="8.5" fill="#512c34" />
                            <circle cx="-8.1" cy="-.8" r="2.2" fill="#fffdf1" />
                            <circle cx="22.2" cy="-1" r="2.4" fill="#fffdf1" />
                        </g>
                        <g className={styles.deliverySmile}>
                            <path d="M0 22q13 3 26-3-3 14-13 15Q4 34 0 22Z" fill="#713640" stroke="#8e493e" strokeWidth="1.5" />
                            <path d="M8 30q5-4 12-2-5 7-12 2Z" fill="#ed9991" />
                        </g>
                        <ellipse className={styles.deliveryGasp} cx="13" cy="26" rx="7" ry="8" fill="#713640" stroke="#8e493e" strokeWidth="1.5" />
                    </g>
                    <g transform="translate(91 16)">
                        <g className={styles.deliveryBox}>
                            <g className={styles.deliverySurprise}>
                                <circle cx="1" cy="-70" r="61" fill="url(#prelude-glow)" />
                                <g fill="#ffe4a9" className={styles.deliverySparkles}>
                                    <path d="M-40-81q0 9 9 9-9 0-9 9 0-9-9-9 9 0 9-9Zm78-22q0 11 11 11-11 0-11 11 0-11-11-11 11 0 11-11Z" />
                                    <circle cx="-28" cy="-108" r="2" /><circle cx="48" cy="-56" r="2.5" />
                                    <circle cx="-51" cy="-45" r="1.8" /><circle cx="23" cy="-117" r="1.5" />
                                </g>
                                <path d="M-41-54h82l-6 8h-70Z" fill="#bf7b83" stroke="#9a5a69" strokeWidth="1.7" />
                                <path d="M-34-80h68v25q-34 15-68 0Z" fill="url(#prelude-icing)" stroke="#ab6772" strokeWidth="1.6" />
                                <ellipse cy="-80" rx="34" ry="9" fill="#ffe5c8" />
                                <path d="M-33-76q8 15 16 5 9 15 17 3 9 12 18-3 8 10 15-5" fill="none" stroke="#fff3dc" strokeWidth="3.2" strokeLinecap="round" />
                                <path d="M-3-81v-22h6v22Z" fill="#d9878d" stroke="#a96770" strokeWidth="1.4" />
                                <path d="M0-105q-8-4 1-14 8 10-1 14Z" fill="#ffd381" stroke="#e49b56" strokeWidth="1.3" />
                            </g>
                            <rect x="-46" y="-37" width="92" height="73" rx="5" fill="url(#prelude-icing)" stroke="#a7616e" strokeWidth="2" />
                            <path d="M-8-37H8v73H-8Z" fill="url(#delivery-ribbon)" />
                            <path d="M-42-28v56q0 3 3 3h75" fill="none" stroke="#ffe3c0" opacity=".6" strokeWidth="1.5" />
                            <g className={styles.deliveryLid}>
                                <rect x="-51" y="-44" width="102" height="19" rx="4" fill="#ecb5a5" stroke="#a7616e" strokeWidth="2" />
                                <path d="M-8-44H8v19H-8Z" fill="url(#delivery-ribbon)" />
                                <path d="M0-44c-17 0-34-10-25-20 6-6 18 1 25 20Zm0 0c17 0 34-10 25-20-6-6-18 1-25 20Z" fill="url(#delivery-ribbon)" stroke="#bb8655" strokeWidth="1.7" />
                                <circle cy="-43" r="4.8" fill="#ffe7ac" stroke="#bb8655" strokeWidth="1.3" />
                            </g>
                            <path className={styles.deliveryHold} d="M44 5q-8-4-12 1-4 6 0 12 4 6 12 2Z" fill="#ffbe69" stroke="#9f5744" strokeWidth="2.2" />
                        </g>
                    </g>
                    <g className={styles.deliveryHold} fill="#ffbe69" stroke="#9f5744" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M49 29q17 12 32 7l6 1q5 3 2 8-5 7-16 6-21-1-28-11" />
                    </g>
                    <path className={styles.deliveryRest} d="M47 26q14 10 14 20-3 9-10 1-5-6-14-7" fill="#eca055" stroke="#965240" strokeWidth="2.3" strokeLinecap="round" />
                    <path className={styles.deliveryWaveMarks} d="M-83-11q-4-5-9-6m13 2q-1-6-5-11" fill="none" stroke="#efc590" strokeWidth="1.7" strokeLinecap="round" />
                    <text className={styles.deliveryOops} x="31" y="-71" fill="#ffde95">!!!</text>
                </g>
            </g>
            <g transform="translate(483 260)">
                <g className={styles.deliveryBerry}>
                    <ellipse cy="51" rx="43" ry="7" fill="#1d111d" opacity=".4" />
                    <path d="M-20 36v13q8 6 15 0l2-11m13 0 2 13q11 4 15-4l-4-12" fill="#be6277" stroke="#8a4b61" strokeWidth="2" strokeLinejoin="round" />
                    <path d="M-32 9q-9 13-19 4-4-7-8-3-6 5 2 15 11 13 29 3m54-21q10 14 22 4 5-5 8-2 5 6-4 16-12 9-24 2" fill="#dc7785" stroke="#a75569" strokeWidth="2" strokeLinecap="round" />
                    <path d="M-42-19c4-30 82-34 86 2 5 26-22 58-43 61C-20 42-47 8-42-19Z" fill="url(#delivery-berry)" stroke="#a75569" strokeWidth="2.1" />
                    <path d="M0-36q-21 7-35-10 13-7 29-2-4-11 6-20 11 10 9 22 14-9 31-5-6 19-34 15-3 5-6 0Z" fill="url(#delivery-leaf)" stroke="#64845c" strokeWidth="2" strokeLinejoin="round" />
                    <g fill="#ffdcaa" opacity=".9">
                        <ellipse cx="-26" cy="-17" rx="1.6" ry="3" transform="rotate(-19 -26 -17)" />
                        <ellipse cx="-11" cy="-23" rx="1.5" ry="3" />
                        <ellipse cx="16" cy="-23" rx="1.5" ry="3" />
                        <ellipse cx="31" cy="-11" rx="1.5" ry="2.7" transform="rotate(18 31 -11)" />
                        <ellipse cx="-27" cy="16" rx="1.5" ry="2.5" /><ellipse cx="26" cy="19" rx="1.5" ry="2.5" />
                        <ellipse cx="-13" cy="28" rx="1.4" ry="2.5" /><ellipse cx="9" cy="33" rx="1.4" ry="2.5" />
                    </g>
                    <path d="M-23 1q6-9 12 0m11 0q6-9 12 0" fill="none" stroke="#622d40" strokeWidth="2.8" strokeLinecap="round" />
                    <path d="M-13 12q7 1 14-1-6 12-14 1Z" fill="#753448" />
                    <ellipse cx="-24" cy="10" rx="6.6" ry="3.5" fill="#ffb1a8" />
                    <ellipse cx="18" cy="10" rx="6.6" ry="3.5" fill="#ffb1a8" />
                    <path className={styles.deliveryHeart} d="M-4-81c-14-10-9-20 0-13 8-7 14 3 0 13Z" fill="#f4a494" />
                </g>
            </g>
        </g>
    );
}
