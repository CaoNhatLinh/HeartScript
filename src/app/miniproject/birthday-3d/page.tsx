import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { birthdayPath } from '@/lib/auth-destination';
import { verifySessionToken } from '@/lib/verify-session';
import BirthdayCountdown from '@/components/love-journey/miniprojects/birthday/BirthdayCountdown';
import BirthdayEntry from '@/components/love-journey/miniprojects/birthday/BirthdayEntry';
import { birthdayUnlockAt } from '@/components/love-journey/miniprojects/birthday/birthday-release';
import { birthdayChapters, birthdayLetter, birthdayMemories } from '@/components/love-journey/miniprojects/birthday/birthday-story';

export const dynamic = 'force-dynamic';

export const viewport: Viewport = { viewportFit: 'cover' };

export const metadata: Metadata = {
    title: 'Một ngày, có em. | HeartScript',
    description: 'Một món quà nhỏ dành riêng cho ngày sinh nhật của em.',
    robots: { index: false, follow: false },
};

export default async function BirthdayPage() {
    // This dynamic server route reads the clock anew for each request.
    // eslint-disable-next-line react-hooks/purity
    const serverNow = Date.now();
    if (serverNow < birthdayUnlockAt) return <BirthdayCountdown serverNow={serverNow} />;

    const token = (await cookies()).get('session_token')?.value;
    if (!await verifySessionToken(token)) redirect(`/login?next=${encodeURIComponent(birthdayPath)}`);

    return <BirthdayEntry story={{ chapters: birthdayChapters, memories: birthdayMemories, letter: birthdayLetter }} />;
}
