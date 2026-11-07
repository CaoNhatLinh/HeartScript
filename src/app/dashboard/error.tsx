'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Something went wrong!</h2>
            <p className="text-gray-500">We couldn&apos;t load this part of our space.</p>
            <button
                onClick={() => reset()}
                className="heart-glass-button px-4 py-2"
                data-glass-variant="primary"
            >
                Try again
            </button>
        </div>
    );
}
