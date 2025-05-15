'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaShieldAlt, FaFileContract, FaInfoCircle, FaExternalLinkAlt } from 'react-icons/fa';

export default function LegalHubPage() {
    // State to track which content tab is active
    const [activeTab, setActiveTab] = useState('privacy');

    return (
        <div className="bg-beige-200 min-h-screen py-12">
            <div className="max-w-5xl mx-auto px-4">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Legal Information</h1>
                    <p className="text-gray-600 text-lg">Privacy, Terms, and Company Information</p>
                </div>

                {/* Tab navigation */}
                <div className="bg-white rounded-lg shadow-sm mb-8">
                    <div className="flex flex-wrap border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('privacy')}
                            className={`px-6 py-4 text-lg font-medium focus:outline-none ${activeTab === 'privacy'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center">
                                <FaShieldAlt className="mr-2" />
                                Privacy Policy
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveTab('terms')}
                            className={`px-6 py-4 text-lg font-medium focus:outline-none ${activeTab === 'terms'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center">
                                <FaFileContract className="mr-2" />
                                Terms of Service
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveTab('about')}
                            className={`px-6 py-4 text-lg font-medium focus:outline-none ${activeTab === 'about'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center">
                                <FaInfoCircle className="mr-2" />
                                About MCPH
                            </div>
                        </button>
                    </div>

                    <div className="p-6">
                        {/* Privacy Policy Preview */}
                        {activeTab === 'privacy' && (
                            <div className="animate-fadeIn">
                                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Privacy Policy</h2>
                                <p className="text-gray-600 mb-4">
                                    MCPH is committed to protecting your privacy. This Privacy Policy explains how we collect, use,
                                    and safeguard your information when you use our file-sharing service. We've designed our service
                                    with privacy as a core principle, minimizing data collection and ensuring all files are automatically
                                    deleted after their expiration period.
                                </p>

                                <h3 className="text-xl font-semibold text-primary-500 mb-3">Key Privacy Points</h3>
                                <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
                                    <li>Files are automatically deleted after their expiration period</li>
                                    <li>We collect minimal technical information necessary for service operation</li>
                                    <li>Files are encrypted at rest in Google Cloud Storage</li>
                                    <li>We don't track users or require account creation for basic usage</li>
                                    <li>We maintain minimal logs with a short retention period (7 days)</li>
                                </ul>

                                <Link
                                    href="/privacy"
                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Read the full Privacy Policy <FaExternalLinkAlt className="ml-2 h-3 w-3" />
                                </Link>
                            </div>
                        )}

                        {/* Terms of Service Preview */}
                        {activeTab === 'terms' && (
                            <div className="animate-fadeIn">
                                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Terms of Service</h2>
                                <p className="text-gray-600 mb-4">
                                    By accessing or using MCPH's file-sharing service, you agree to be bound by these Terms of Service.
                                    If you disagree with any part of the terms, you do not have permission to access or use our service.
                                </p>

                                <h3 className="text-xl font-semibold text-primary-500 mb-3">Key Terms</h3>
                                <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
                                    <li>Files are automatically deleted after the expiration period</li>
                                    <li>Maximum file size limit of 500MB per upload</li>
                                    <li>You must not upload illegal or prohibited content</li>
                                    <li>We reserve the right to remove content that violates our terms</li>
                                    <li>The service is provided "as is" without warranties</li>
                                </ul>

                                <Link
                                    href="/terms"
                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Read the full Terms of Service <FaExternalLinkAlt className="ml-2 h-3 w-3" />
                                </Link>
                            </div>
                        )}

                        {/* About MCPH */}
                        {activeTab === 'about' && (
                            <div className="animate-fadeIn">
                                <h2 className="text-2xl font-semibold text-gray-800 mb-4">About MCPH</h2>
                                <p className="text-gray-600 mb-6">
                                    MCPH was built with a simple mission: to make secure file sharing effortless while
                                    prioritizing privacy through ephemeral storage. We believe that file sharing should be
                                    simple, secure, and respect your privacy by default.
                                </p>

                                <h3 className="text-xl font-semibold text-primary-500 mb-3">Our Technology</h3>
                                <p className="text-gray-600 mb-4">
                                    MCPH is built using modern technologies to ensure reliability, security, and performance:
                                </p>
                                <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
                                    <li><strong>Frontend:</strong> Next.js with TypeScript and React</li>
                                    <li><strong>Storage:</strong> Google Cloud Storage with automatic lifecycle management</li>
                                    <li><strong>Security:</strong> Encryption at rest and in transit</li>
                                    <li><strong>Deployment:</strong> Hosted on Vercel with edge functions</li>
                                </ul>

                                <Link
                                    href="/about"
                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Learn more about MCPH <FaExternalLinkAlt className="ml-2 h-3 w-3" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Us</h2>
                    <p className="text-gray-600 mb-4">
                        If you have any questions about our Privacy Policy, Terms of Service, or anything else, please contact us:
                    </p>

                    <div className="flex flex-col space-y-2">
                        <a href="mailto:privacy@mcph.io" className="text-blue-600 hover:text-blue-800">privacy@mcph.io</a>
                        <a href="mailto:legal@mcph.io" className="text-blue-600 hover:text-blue-800">legal@mcph.io</a>
                        <a href="mailto:support@mcph.io" className="text-blue-600 hover:text-blue-800">support@mcph.io</a>
                    </div>
                </div>

                {/* Last Updated */}
                <div className="text-center text-sm text-gray-500">
                    <p>Last updated: May 14, 2025</p>
                </div>
            </div>
        </div>
    );
}