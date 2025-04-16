"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaTachometerAlt, FaUserCircle } from 'react-icons/fa';
import LoginModal from 'components/ui/LoginModal';
import BrandIcon from 'components/ui/BrandIcon';
import { useSupabase } from 'app/supabase-provider';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const { supabase, session } = useSupabase();
    const pathname = usePathname();
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isActive = (path: string) => pathname === path;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center">
                        {session ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:text-primary-700 font-medium border border-primary-200 rounded-md hover:bg-primary-50 transition-colors"
                                >
                                    <FaUser className="h-4 w-4" />
                                    <span>Profile</span>
                                </button>

                                {isProfileDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-100">
                                        <Link
                                            href="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                        >
                                            <FaUserCircle className="mr-2" /> My Profile
                                        </Link>
                                        <Link
                                            href="/dashboard"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                        >
                                            <FaTachometerAlt className="mr-2" /> Dashboard
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setIsProfileDropdownOpen(false);
                                                handleLogout();
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                        >
                                            <FaSignOutAlt className="mr-2" /> Log Out
                                        </button>
                                    </div>
                                )}
                            </div>
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
                                        <FaTachometerAlt className="inline mr-2" />
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/profile"
                                        className={`text-gray-600 hover:text-gray-900 px-4 py-2 ${isActive('/profile') ? 'bg-gray-50 text-gray-900' : ''}`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <FaUserCircle className="inline mr-2" />
                                        Profile
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            handleLogout();
                                        }}
                                        className="w-full text-left text-gray-600 hover:text-gray-900 px-4 py-2"
                                    >
                                        <FaSignOutAlt className="inline mr-2" />
                                        Log Out
                                    </button>
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
