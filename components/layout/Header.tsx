"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaBars, FaTimes } from 'react-icons/fa';
import Image from 'next/image'; // Import the Image component

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <header className="bg-stone-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center gap-2 px-2 py-1">
                            <Image src="/icon.png" alt="Logo" width={64} height={64} />
                            <span className="text-gray-900 font-bold text-3xl ml-2">MCPH</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-6">
                        <Link
                            href="/"
                            className={`text-gray-700 hover:text-gray-900 font-medium ${isActive('/') ? 'text-gray-900 border-b-2 border-primary-500' : ''}`}
                        >
                            Home
                        </Link>
                        <Link
                            href="/docs"
                            className={`text-gray-700 hover:text-gray-900 font-medium ${isActive('/docs') ? 'text-gray-900 border-b-2 border-primary-500' : ''}`}
                        >
                            API Docs
                        </Link>
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-500 hover:text-gray-900">
                            {isMenuOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 space-y-4 border-t border-gray-200 bg-stone-50 animate-fadeIn">
                        <nav className="flex flex-col space-y-3">
                            <Link
                                href="/"
                                className={`text-gray-700 hover:text-gray-900 px-4 py-2 ${isActive('/') ? 'bg-gray-100 text-gray-900' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Home
                            </Link>
                            <Link
                                href="/docs"
                                className={`text-gray-700 hover:text-gray-900 px-4 py-2 ${isActive('/docs') ? 'bg-gray-100 text-gray-900' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                API Docs
                            </Link>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
