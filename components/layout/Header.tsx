"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { FaBars, FaTimes } from 'react-icons/fa';
import LoginModal from '../LoginModal';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="bg-white border-b border-blue-50 sticky top-0 z-10 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="text-xl font-semibold flex items-center gap-2 transition-colors">
                            <span className="bg-blue-600 text-white px-2 py-1 rounded">MCP</span>
                            <span className="text-neutral-800">Registry</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link href="/submit" className="text-neutral-700 hover:text-blue-600 transition-colors font-medium border-b-2 border-transparent hover:border-blue-600 py-1">
                            Submit MCP
                        </Link>
                        <Link href="/about" className="text-neutral-700 hover:text-blue-600 transition-colors font-medium border-b-2 border-transparent hover:border-blue-600 py-1">
                            About
                        </Link>
                        <Link href="/docs" className="text-neutral-700 hover:text-blue-600 transition-colors font-medium border-b-2 border-transparent hover:border-blue-600 py-1">
                            Documentation
                        </Link>
                    </nav>

                    {/* Auth Button */}
                    <div className="hidden md:block">
                        <LoginModal />
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-neutral-500 hover:text-blue-600 transition-colors">
                            {isMenuOpen
                                ? <FaTimes className="h-6 w-6" />
                                : <FaBars className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-5 space-y-5 border-t border-blue-50 bg-white animate-fadeIn">
                        <nav className="flex flex-col space-y-4">
                            <Link
                                href="/submit"
                                className="text-neutral-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md transition-all"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Submit MCP
                            </Link>
                            <Link
                                href="/about"
                                className="text-neutral-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md transition-all"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                About
                            </Link>
                            <Link
                                href="/docs"
                                className="text-neutral-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md transition-all"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Documentation
                            </Link>
                        </nav>

                        <div className="flex justify-center pt-2 border-t border-blue-50">
                            <LoginModal />
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
