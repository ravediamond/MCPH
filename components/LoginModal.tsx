import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FaGithub } from 'react-icons/fa';

export default function LoginModal() {
    const [isOpen, setIsOpen] = useState(false);

    const onOpen = () => setIsOpen(true);
    const onClose = () => setIsOpen(false);

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: 'http://localhost:3000/dashboard',
            },
        });
        if (error) {
            console.error('Login error:', error);
        }
    };

    return (
        <>
            <button
                className="text-sm font-medium bg-neutral-800 text-white px-4 py-2 rounded-md hover:bg-neutral-700 transition-colors"
                onClick={onOpen}
            >
                Login with GitHub
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Modal Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md z-50 overflow-hidden relative">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium">Login with GitHub</h3>
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                                aria-label="Close"
                            >
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4">
                            <p className="mb-4">
                                Proceed to login with your GitHub account by clicking the button below.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-3">
                            <button
                                className="bg-[#24292e] hover:bg-[#1b1f23] active:bg-[#141619] text-white px-4 py-2 rounded flex items-center"
                                onClick={() => {
                                    handleLogin();
                                    onClose();
                                }}
                            >
                                <FaGithub className="mr-2" />
                                Continue with GitHub
                            </button>
                            <button
                                className="text-gray-700 bg-transparent hover:bg-gray-100 px-4 py-2 rounded"
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
