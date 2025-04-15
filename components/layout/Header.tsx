"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaBars, FaTimes, FaUser, FaSearch } from 'react-icons/fa';
import LoginModal from 'components/ui/LoginModal';
import BrandIcon from 'components/ui/BrandIcon';
import SearchBar from 'components/SearchBar';
import { useSupabase } from 'app/supabase-provider';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const { supabase, session } = useSupabase();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;
    
    return (
        <header className="bg-white border-b border-blue-50 sticky top-0 z-10 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center gap-2 transition-colors">
                            <BrandIcon />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link
                            href="/browse"
                            className={`text-neutral-700 hover:text-blue-600 transition-colors font-medium border-b-2 ${isActive('/browse') ? 'border-blue-600 text-blue-600' : 'border-transparent'} hover:border-blue-600 py-1`}
                        >
                            Browse
                        </Link>
                        <Link
                            href="/docs"
                            className={`text-neutral-700 hover:text-blue-600 transition-colors font-medium border-b-2 ${isActive('/docs') ? 'border-blue-600 text-blue-600' : 'border-transparent'} hover:border-blue-600 py-1`}
                        >
                            Documentation
                        </Link>
                        <Link
                            href="/about"
                            className={`text-neutral-700 hover:text-blue-600 transition-colors font-medium border-b-2 ${isActive('/about') ? 'border-blue-600 text-blue-600' : 'border-transparent'} hover:border-blue-600 py-1`}
                        >
                            About
                        </Link>
                        {session && (
                            <Link
                                href="/dashboard"
                                className={`text-neutral-700 hover:text-blue-600 transition-colors font-medium border-b-2 ${isActive('/dashboard') ? 'border-blue-600 text-blue-600' : 'border-transparent'} hover:border-blue-600 py-1`}
                            >
                                Dashboard
                            </Link>
                        )}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center space-x-4">
                        <button 
                            onClick={() => setShowSearch(!showSearch)}
                            className="text-neutral-700 hover:text-blue-600 transition-colors p-2"
                            aria-label="Search"
                        >
                            <FaSearch className="w-5 h-5" />
                        </button>
                        
                        {session ? (
                            <Link
                                href="/profile"
                                className="flex items-center gap-2 text-neutral-700 hover:text-blue-600 transition-colors p-2"
                            >
                                <FaUser className="w-5 h-5" />
                                <span>Profile</span>
                            </Link>
                        ) : (
                            <LoginModal />
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-neutral-500 hover:text-blue-600 transition-colors">
                            {isMenuOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Search Bar (shown when toggle is clicked) */}
                {showSearch && (
                    <div className="py-3 border-t border-blue-50 animate-fadeIn">
                        <SearchBar 
                            placeholder="Search MCPs..." 
                            className="mb-0"
                        />
                    </div>
                )}

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-5 space-y-5 border-t border-blue-50 bg-white animate-fadeIn">
                        {/* Mobile Search */}
                        <div className="px-4">
                            <SearchBar 
                                placeholder="Search MCPs..." 
                                className="mb-0"
                            />
                        </div>
                        
                        <nav className="flex flex-col space-y-4">
                            <Link
                                href="/browse"
                                className={`text-neutral-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md transition-all ${isActive('/browse') ? 'bg-blue-50 text-blue-600' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Browse MCPs
                            </Link>
                            <Link
                                href="/docs"
                                className={`text-neutral-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md transition-all ${isActive('/docs') ? 'bg-blue-50 text-blue-600' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Documentation
                            </Link>
                            <Link
                                href="/about"
                                className={`text-neutral-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md transition-all ${isActive('/about') ? 'bg-blue-50 text-blue-600' : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                About
                            </Link>
                            {session && (
                                <>
                                    <Link
                                        href="/dashboard"
                                        className={`text-neutral-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md transition-all ${isActive('/dashboard') ? 'bg-blue-50 text-blue-600' : ''}`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/profile"
                                        className={`text-neutral-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md transition-all ${isActive('/profile') ? 'bg-blue-50 text-blue-600' : ''}`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Profile
                                    </Link>
                                </>
                            )}
                        </nav>

                        <div className="flex justify-center pt-2 border-t border-blue-50">
                            {!session && <LoginModal />}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
