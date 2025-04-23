'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback: React.ReactNode;
}

export default function ErrorBoundary({
    children,
    fallback
}: ErrorBoundaryProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Report errors to your analytics service if needed
    }, [pathname, searchParams]);

    return (
        <>
            {children}
        </>
    );
}

export function ErrorFallback() {
    return (
        <div className="flex flex-col items-center justify-center h-96">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="mb-4">We apologize for the inconvenience. Please try again later.</p>
            <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
                Reload page
            </button>
        </div>
    );
}