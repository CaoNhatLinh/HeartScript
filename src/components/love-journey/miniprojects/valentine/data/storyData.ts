/**
 * Story Data - Valentine Visual Story
 * 
 * Mạch câu chuyện:
 * 1. PRELUDE: Màn hình chờ, hoa hồng đang nụ
 * 2. INTRO: User click -> Hoa bắt đầu nở, mascots xuất hiện
 * 3. BLOOM: Hoa nở dần, lời dẫn nhẹ nhàng
 * 4. ENVELOPE: Thư xuất hiện khi hoa nở >85%
 * 5. LETTER: User đọc thư
 * 6. CLIMAX: Quà ngọt ngào (chocolate, memories)
 * 7. ENDING: Kết thúc cảm xúc
 */

export interface StoryLine {
    id: string;
    text: string;
    subText?: string;
    // Trigger điều kiện để chuyển sang step tiếp theo
    trigger?: 'none' | 'bloom' | 'chocolate' | 'photo' | 'letter_open' | 'auto' | 'after_letter' | 'after_chocolate';
    // Vị trí hiển thị
    layout: 'center' | 'top-left' | 'top-right' | 'bottom-right' | 'top-center' | 'bottom-center' | 'center-left' | 'bottom-left';
    // Phong cách hiển thị
    emphasis?: 'whisper' | 'normal' | 'grand' | 'dramatic';
    // Thời gian hiển thị (ms), 0 = vô hạn
    duration?: number;
    // Scene tương ứng (optional, để sync camera)
    scene?: 'prelude' | 'intro' | 'flower' | 'climax' | 'chocolate' | 'ending';
    // Modal to show at this step
    showModal?: 'memory' | 'promise';
}

export const STORY_LINES: StoryLine[] = [
    // =====================================================
    // STEP 0: Lời mở đầu - Khi user vừa click vào hoa
    // =====================================================
    {
        id: 'opening',
        text: "Có một món quà nhỏ...",
        subText: "dành riêng cho người anh thương",
        trigger: 'none',
        layout: 'top-center',
        emphasis: 'whisper',
        duration: 5000,
        scene: 'intro'
    },

    // =====================================================
    // STEP 1: Hoa đang nở - Tình yêu đang nảy nở
    // =====================================================
    {
        id: 'blooming',
        text: "Từng cánh hoa...",
        subText: "là từng nhịp đập trái tim anh dành cho em",
        trigger: 'bloom',
        layout: 'top-left',
        emphasis: 'whisper',
        duration: 6000,
        scene: 'flower'
    },

    // =====================================================
    // STEP 2 (NEW): Kỷ niệm gặp nhau - Modal 1
    // =====================================================
    {
        id: 'first_memory',
        text: "Anh còn nhớ ngày đầu tiên...",
        subText: "khi anh gặp em, mọi thứ thay đổi",
        trigger: 'auto',
        layout: 'center',
        emphasis: 'normal',
        duration: 4000,
        scene: 'flower',
        showModal: 'memory'
    },

    // =====================================================
    // STEP 3: Thư xuất hiện - Lời yêu thương
    // =====================================================
    {
        id: 'letter_reveal',
        text: "Anh có điều muốn nói...",
        subText: "được viết trong lá thư này",
        trigger: 'letter_open',
        layout: 'top-right',
        emphasis: 'normal',
        duration: 5000,
        scene: 'flower'
    },



    // =====================================================
    // STEP 5: Chuẩn bị quà ngọt ngào
    // =====================================================
    {
        id: 'sweet_transition',
        text: "Và còn một điều ngọt ngào...",
        subText: "anh muốn gửi tặng em",
        trigger: 'auto',
        layout: 'top-center',
        emphasis: 'normal',
        duration: 4000,
        scene: 'climax'
    },

    // =====================================================
    // STEP 6: Chocolate - Vị ngọt của tình yêu
    // =====================================================
    {
        id: 'chocolate_love',
        text: "Ngọt ngào như tình yêu của chúng mình...",
        subText: "mỗi viên chocolate là một lời hứa",
        trigger: 'chocolate',
        layout: 'bottom-center',
        emphasis: 'grand',
        duration: 6000,
        scene: 'chocolate'
    },

    // =====================================================
    // STEP 7 (NEW): Lời hứa tương lai - Modal 3
    // =====================================================
    {
        id: 'promise',
        text: "Em là điều tuyệt vời nhất...",
        subText: "anh có một lời hứa dành cho em",
        trigger: 'after_chocolate',
        layout: 'center',
        emphasis: 'grand',
        duration: 4000,
        scene: 'chocolate',
        showModal: 'promise'
    },

    // =====================================================
    // STEP 8: Kết thúc - Lời yêu thương cuối
    // =====================================================
    {
        id: 'finale',
        text: "Happy Valentine's Day!",
        subText: "Cảm ơn em vì đã là một phần trong cuộc đời anh",
        trigger: 'auto',
        layout: 'center',
        emphasis: 'dramatic',
        duration: 0, // Hiển thị mãi
        scene: 'ending'
    }
];

// =====================================================
// STORY METADATA - Thông tin bổ sung cho mỗi giai đoạn
// =====================================================
export const STORY_METADATA = {
    config: {
        defaultDuration: 5000,
        fadeInDuration: 700,
        fadeOutDuration: 500
    },

    // Ánh sáng cho từng scene
    lighting: {
        prelude: { ambient: 0.3, key: 0.5, warm: 0.2 },
        intro: { ambient: 0.4, key: 0.7, warm: 0.3 },
        flower: { ambient: 0.5, key: 0.9, warm: 0.5 },
        climax: { ambient: 0.6, key: 1.0, warm: 0.6 },
        chocolate: { ambient: 0.5, key: 0.8, warm: 0.7 },
        ending: { ambient: 0.7, key: 1.2, warm: 0.8 }
    },

    // Camera positions cho từng scene
    camera: {
        prelude: { position: [0, 1, 8], target: [0, 0, 0], fov: 45 },
        intro: { position: [0, 0.5, 6], target: [0, 0, 0], fov: 50 },
        flower: { position: [2, 1, 5], target: [0, 0.5, 0], fov: 55 },
        climax: { position: [-1, 2, 5], target: [0, 0, 0], fov: 50 },
        chocolate: { position: [0, 1, 4], target: [0.5, 0, 0], fov: 55 },
        ending: { position: [0, 0.5, 6], target: [0, 0, 0], fov: 45 }
    }
};

// Helper: Lấy story line theo id
export const getStoryLineById = (id: string): StoryLine | undefined => {
    return STORY_LINES.find(line => line.id === id);
};

// Helper: Lấy index của story line theo scene
export const getStoryIndexByScene = (scene: string): number => {
    const index = STORY_LINES.findIndex(line => line.scene === scene);
    return index >= 0 ? index : 0;
};


