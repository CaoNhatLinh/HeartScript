import 'server-only';

export const birthdayChapters = [
    {
        id: 'cake',
        label: 'Điều ước',
        title: ['Một ngày,', 'có em.'],
        description: 'Sinh nhật vui vẻ nha. Ước một điều rồi thổi nến nhé.',
    },
    {
        id: 'frame',
        label: 'Kỷ niệm',
        title: ['Những ngày', 'có nhau.'],
        description: 'Anh lục lại cuộn ảnh, lựa được ba tấm muốn cho em xem. Bấm qua coi thử nè.',
    },
    {
        id: 'envelope',
        label: 'Thư tay',
        title: ['Một lá thư', 'gửi em.'],
        description: 'Anh viết thêm mấy dòng cho em. Mở ra đọc nha.',
    },
] as const;

export type BirthdaySceneId = typeof birthdayChapters[number]['id'];

export const birthdayMemories = [
    {
        image: '/memory-first-meet.png',
        alt: 'Hai đứa chụp ảnh cùng nhau, em giơ tay tạo dáng',
        frame: 'brass',
    },
    {
        image: '/valentine/img/z7133499668854_9b365372d9134ee097cb79f5f7a4844c.jpg',
        alt: 'Em ngồi cạnh một luống hoa',
        frame: 'ribbon',
    },
    {
        image: '/valentine/img/z7531538979814_f4dafc6311426dff9f5a08e3c7ae37c2.jpg',
        alt: 'Em cầm bó hoa tulip trắng',
        frame: 'oval',
    },
] as const;

export const birthdayLetter = {
    greeting: 'Ngọc iu ơi,',
    paragraphs: [
        'Chúc bé iu của anh lại có một năm sinh nhật vui vẻ nữa nhaaa. Tuổi mới anh chúc em ngủ đủ hơn, được ăn nhiều món em thích và có thời gian làm mấy thứ em chưa làm được ạ.',
        'anh yêu em nhìu ơi là nhìuuuuuuu',
        'Có chuyện gì vui thì kể anh nghe, hôm nào mệt hay buồn cũng kể anh luôn nha. Không cần phải nghĩ nói gì cho hay đâu, anh nghe em kể linh tinh cũng được mà. Mong tuổi mới bé sẽ có nhiều ngày vui hơn, bớt lo mấy chuyện làm mình đau đầu nữa.',
        'Còn nhiều món chưa ăn, nhiều chỗ chưa đi, mình để dành rồi đi cùng nhau nha bé. Sinh nhật năm nay, rồi mấy năm sau nữa, anh vẫn muốn được ngồi cạnh em, hát chúc mừng sinh nhật rồi ăn ké bánh của em thui :)',
    ],
    signature: 'Anh',
};

export type BirthdayStory = {
    chapters: typeof birthdayChapters;
    memories: typeof birthdayMemories;
    letter: typeof birthdayLetter;
};
