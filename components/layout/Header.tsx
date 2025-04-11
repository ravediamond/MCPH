"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { FaBars, FaTimes } from 'react-icons/fa';
import LoginModal from '../LoginModal';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="bg-white border-b border-neutral-200 shadow-soft sticky top-0 z-10">
            <div className="container mx-auto px-4 md:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="text-xl font-semibold text-neutral-900 flex items-center gap-2 hover:text-primary-600 transition-colors">
                            <span className="text-primary-600">MCP</span>Registry
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-6">
                        <Link href="/submit" className="text-neutral-700 hover:text-primary-600 transition-colors text-sm font-medium">
                            Submit MCP
                        </Link>
                        <Link href="/about" className="text-neutral-700 hover:text-primary-600 transition-colors text-sm font-medium">
                            About
                        </Link>
                        <Link href="/docs" className="text-neutral-700 hover:text-primary-600 transition-colors text-sm font-medium">
                            Documentation
                        </Link>
                    </nav>

                    {/* Auth Button */}
                    <div className="hidden md:block">
                        <LoginModal />
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-neutral-500 hover:text-neutral-700">
                            {isMenuOpen
                                ? <FaTimes className="h-6 w-6" />
                                : <FaBars className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 space-y-4 border-t border-neutral-200">
                        <nav className="flex flex-col space-y-3">
                            <Link href="/submit" className="text-neutral-700 hover:text-primary-600 transition-colors text-sm font-medium">
                                Submit MCP
                            </Link>
                            <Link href="/about" className="text-neutral-700 hover:text-primary-600 transition-colors text-sm font-medium">
                                About
                            </Link>
                            <Link href="/docs" className="text-neutral-700 hover:text-primary-600 transition-colors text-sm font-medium">
                                Documentation
                            </Link>
                        </nav>

                        <div className="flex justify-center pt-2 border-t border-neutral-200">
                            <LoginModal />
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
