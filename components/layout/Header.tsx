"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaBars, FaTimes, FaUser } from 'react-icons/fa';
import LoginModal from 'components/ui/LoginModal';
import BrandIcon from 'components/ui/BrandIcon';
import { useSupabase } from 'app/supabase-provider';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { supabase, session } = useSupabase();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center gap-2">
                            <BrandIcon />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-6">
                        <Link
                            href="/browse"
                            className={`text-gray-600 hover:text-gray-900 font-medium ${isActive('/browse') ? 'text-gray-900 border-b-2 border-gray-900' : ''}`}
                        >
                            Browse
                        </Link>
                        <Link
                            href="/docs"
                            className={`text-gray-600 hover:text-gray-900 font-medium ${isActive('/docs') ? 'text-gray-900 border-b-2 border-gray-900' : ''}`}
                        >
                            Documentation
                        </Link>
                        <Link
                            href="/about"
                            className={`text-gray-600 hover:text-gray-900 font-medium ${isActive('/about') ? 'text-gray-900 border-b-2 border-gray-900' : ''}`}
                        >
                            About
                        </Link>
                        {session && (
                            <Link
                                href="/dashboard"
                                className={`text-gray-600 hover:text-gray-900 font-medium ${isActive('/dashboard') ? 'text-gray-900 border-b-2 border-gray-900' : ''}`}
                            >
                                Dashboard
                            </Link>
                        )}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center">
                        {session ? (
                            <Link
                                href="/profile"
                                className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:text-primary-700 font-medium border border-primary-200 rounded-md hover:bg-primary-50 transition-colors"
                            >
                                <FaUser className="h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                        ) : (
                            <LoginModal />
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-500 hover:text-gray-900">
                            {isMenuOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 space-y-4 border-t border-gray-100 bg-white animate-fadeIn">
                        {/* Mobile Search */}
                        <div className="px-4">
                            <Link
                                href="/browse"
                                className="w-full block py-2 px-4 text-gray-600 hover:text-gray-900 rounded-md border border-gray-200"
                            >
                                Search MCPs...
                            </Link>
                        </div>

                        <nav className="flex flex-col space-y-3">
                            <Link
                                href="/browse"
                                className={`text-gray-600 hover:text-gray-900 px-4 py-2 ${isActive('/browse') ? 'bg-gray-50 text-gray-900' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Browse MCPs
                            </Link>
                            <Link
                                href="/docs"
                                className={`text-gray-600 hover:text-gray-900 px-4 py-2 ${isActive('/docs') ? 'bg-gray-50 text-gray-900' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Documentation
                            </Link>
                            <Link
                                href="/about"
                                className={`text-gray-600 hover:text-gray-900 px-4 py-2 ${isActive('/about') ? 'bg-gray-50 text-gray-900' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                About
                            </Link>
                            {session && (
                                <>
                                    <Link
                                        href="/dashboard"
                                        className={`text-gray-600 hover:text-gray-900 px-4 py-2 ${isActive('/dashboard') ? 'bg-gray-50 text-gray-900' : ''}`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-2 mx-4 px-4 py-2 text-primary-600 bg-primary-50 rounded-md border border-primary-200"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <FaUser className="h-4 w-4" />
                                        Profile
                                    </Link>
                                </>
                            )}
                        </nav>

                        <div className="flex justify-center pt-2 border-t border-gray-100">
                            {!session && <LoginModal />}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
