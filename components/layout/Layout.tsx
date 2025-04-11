import React, { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen flex flex-col bg-neutral-50">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 md:px-6 lg:px-8">
                {children}
            </main>
            <Footer />
        </div>
    );
}
