import React, { useState } from 'react';
import { FaGithub, FaUserCircle } from 'react-icons/fa';
import Link from 'next/link';
import { useSupabase } from '../../app/supabase-provider';
import { useRouter } from 'next/navigation';

export default function LoginModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { supabase, session } = useSupabase();
    const router = useRouter();
    const user = session?.user || null;
    const loading = false; // Since we're using the provider, we don't need our own loading state

    const onOpen = () => setIsOpen(true);
    const onClose = () => setIsOpen(false);

    const handleLogin = async () => {
        console.log('Starting login process with GitHub');

        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    // Set a scopes parameter if you need specific GitHub permissions
                    scopes: 'read:user user:email',
                }
            });

            if (error) {
                console.error('Login error:', error);
            } else {
                console.log('OAuth sign in initiated successfully', data);
                // The redirect will happen automatically via GitHub OAuth flow
            }
        } catch (err) {
            console.error('Unexpected error during login:', err);
        }
    };

    const handleLogout = async () => {
        console.log('Starting logout process');
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Logout error:', error);
            } else {
                console.log('Logged out successfully');
                router.push('/');
            }
            setUserMenuOpen(false);
        } catch (err) {
            console.error('Unexpected error during logout:', err);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded-md"></div>
        );
    }

    if (user) {
        return (
            <div className="relative">
                <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                    <FaUserCircle className="h-5 w-5" />
                    <span className="font-medium text-sm">
                        {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
                    </span>
                </button>

                {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-sm py-1 z-20 border border-gray-200">
                        <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600">
                            Profile
                        </Link>
                        <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600">
                            Dashboard
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                        >
                            Sign out
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            <button
                className="text-sm font-medium bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition-colors shadow-sm"
                onClick={onOpen}
            >
                Login with GitHub
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Modal Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <div className="bg-white rounded-lg shadow-md w-full max-w-md z-50 overflow-hidden relative">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-800">Login with GitHub</h3>
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                                aria-label="Close"
                            >
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4">
                            <p className="mb-4 text-gray-600">
                                Proceed to login with your GitHub account by clicking the button below.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-3">
                            <button
                                className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md flex items-center transition-colors"
                                onClick={() => {
                                    handleLogin();
                                    onClose();
                                }}
                            >
                                <FaGithub className="mr-2" />
                                Continue with GitHub
                            </button>
                            <button
                                className="text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-md transition-colors"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
