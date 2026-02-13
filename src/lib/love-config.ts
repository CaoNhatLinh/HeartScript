export const MOODS = {
    love: {
        id: 'love',
        keywords: ['yêu', 'thương', 'nhớ', 'hôn', 'love', 'miss', 'kiss', 'tình yêu', 'iu', 'bé', 'honey', 'darling', 'ck', 'vk', 'chồng', 'vợ', 'anh yêu', 'em yêu', 'cưng', 'bé yêu', 'nhớ anh', 'nhớ em', 'yêu anh', 'yêu em', 'thương anh', 'thương em', 'moa', 'chụt chụt'],
        color: 'from-rose-400/20 to-pink-500/20',
        textColor: 'text-rose-600',
        icon: 'Heart',
    },
    happy: {
        id: 'happy',
        keywords: ['vui', 'hạnh phúc', 'cười', 'tuyệt vời', 'vui vẻ', 'mừng', 'happy', 'đỉnh', 'xịn', 'haha', 'hihi', 'kaka', 'sung sướng', 'thích quá', 'phê', 'đã'],
        color: 'from-amber-300/20 to-orange-400/20',
        textColor: 'text-amber-600',
        icon: 'Sun',
    },
    calm: {
        id: 'calm',
        keywords: ['bình yên', 'nhẹ nhàng', 'ngủ ngon', 'thanh thản', 'yên tĩnh', 'peace', 'chill', 'thư giãn', 'thoải mái', 'êm đềm', 'lắng đọng', 'ngủ sớm', 'good night', 'g9'],
        color: 'from-emerald-300/20 to-teal-400/20',
        textColor: 'text-emerald-600',
        icon: 'Cloud',
    },
    sad: {
        id: 'sad',
        keywords: ['buồn', 'khóc', 'xin lỗi', 'tệ', 'đau', 'sad', 'sorry', 'mệt', 'chán', 'áp lực', 'stress', 'nhớ nhà', 'cô đơn', 'tủi thân', 'huhu', 'hic', 'khó chịu'],
        color: 'from-blue-300/20 to-indigo-400/20',
        textColor: 'text-blue-600',
        icon: 'CloudRain',
    },
    default: {
        id: 'default',
        keywords: [],
        color: 'from-stone-200/20 to-stone-300/20',
        textColor: 'text-stone-600',
        icon: 'PenTool',
    }
} as const;

export type MoodType = keyof typeof MOODS;

export const detectMood = (text: string): MoodType => {
    if (!text) return 'default';
    const lowerText = text.toLowerCase();

    const scores = Object.entries(MOODS).map(([id, config]) => {
        if (id === 'default') return { id, score: 0 };

        let totalScore = 0;

        config.keywords.forEach(kw => {
            // Simple includes check - more robust for Vietnamese
            if (lowerText.includes(kw.toLowerCase())) {
                const weight = kw.includes(' ') ? 4 : 2; // Increased single word weight to 2
                // Count occurrences roughly
                const count = lowerText.split(kw.toLowerCase()).length - 1;
                totalScore += count * weight;
            }
        });

        // Exclusions
        const moodExclusions: Record<string, string[]> = {
            happy: ['không vui', 'chẳng vui', 'chả vui', 'đéo vui', 'buồn', 'khóc'],
            sad: ['buồn cười', 'buồn miệng', 'buồn tè', 'buồn ngủ', 'không buồn', 'chả buồn'],
            love: ['nhớ mua', 'nhớ lấy', 'nhớ mang', 'nhớ làm', 'bé cái nhầm', 'em gái', 'anh trai'],
            calm: ['buồn ngủ', 'chán', 'mệt']
        };

        const exclusions = moodExclusions[id] || [];
        exclusions.forEach(ex => {
            if (lowerText.includes(ex)) {
                totalScore -= 10; // Heavy penalty
            }
        });

        return { id, score: totalScore };
    });

    // Sort by score
    scores.sort((a, b) => b.score - a.score);
    const bestMatch = scores[0];

    // Threshold
    return bestMatch.score > 0 ? (bestMatch.id as MoodType) : 'default';
};
