'use client';

import Link from 'next/link';

export default function Home() {
    return (
        <div className="bg-beige-200 min-h-screen">
            {/* Hero Section - Simplified */}
            <section className="py-12 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl font-bold mb-3 text-gray-800">
                        Secure, Simple Artifact Sharing
                    </h1>
                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                        Upload and share artifacts that automatically expire. No account required.
                    </p>

                    {/* Upload Button */}
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 transition duration-300 border border-blue-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        Sign In to Upload
                    </Link>
                </div>
            </section>

            {/* Core Features - Simplified */}
            <section className="py-8 px-4 bg-beige-100">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Feature 1 */}
                        <div className="bg-white rounded p-4 border border-gray-200">
                            <h3 className="font-medium mb-2 text-gray-800">Secure & Private</h3>
                            <p className="text-gray-600 text-sm">
                                Files are encrypted and automatically deleted after expiration.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white rounded p-4 border border-gray-200">
                            <h3 className="font-medium mb-2 text-gray-800">Lightning Fast</h3>
                            <p className="text-gray-600 text-sm">
                                Upload and share instantly with a generated link.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white rounded p-4 border border-gray-200">
                            <h3 className="font-medium mb-2 text-gray-800">Simple to Use</h3>
                            <p className="text-gray-600 text-sm">
                                No accounts or logins needed. Just upload and share.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works - Simplified */}
            <section className="py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-xl font-medium mb-4 text-center text-gray-800">
                        How It Works
                    </h2>

                    <div className="flex flex-wrap justify-center mb-6">
                        <div className="flex items-center mx-4 mb-4">
                            <span className="bg-primary-100 text-primary-500 rounded-full h-8 w-8 flex items-center justify-center mr-2">1</span>
                            <span className="text-gray-700">Upload your artifact</span>
                        </div>
                        <div className="flex items-center mx-4 mb-4">
                            <span className="bg-primary-100 text-primary-500 rounded-full h-8 w-8 flex items-center justify-center mr-2">2</span>
                            <span className="text-gray-700">Get a secure link</span>
                        </div>
                        <div className="flex items-center mx-4 mb-4">
                            <span className="bg-primary-100 text-primary-500 rounded-full h-8 w-8 flex items-center justify-center mr-2">3</span>
                            <span className="text-gray-700">Artifacts auto-expire after set time</span>
                        </div>
                    </div>

                    {/* CTA Button */}
                    {/* Removed duplicate Sign In to Upload button from the bottom section */}
                </div>
            </section>

            {/* Footer Info - Simplified */}
            <section className="py-4 px-4 border-t border-gray-200 text-center">
                <div className="max-w-4xl mx-auto">
                    <p className="text-gray-500 text-xs">
                        Artifacts stored securely. Automatically purged after expiration. No registration required.
                    </p>
                </div>
            </section>
        </div>
    );
}
