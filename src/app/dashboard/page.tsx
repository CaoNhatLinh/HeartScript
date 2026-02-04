'use client';

import dynamic from 'next/dynamic';

const LoveJourneyMap = dynamic(() => import('@/components/love-journey/LoveJourneyMap'), { ssr: false });

export default function DashboardPage() {
    return <div suppressHydrationWarning><LoveJourneyMap /></div>;
}
