import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Love Adventure',
    description: 'Our eternal journey.',
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-neutral-50 overflow-hidden" suppressHydrationWarning>
            {children}
        </div>
    );
}
