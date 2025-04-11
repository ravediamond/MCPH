'use client';

import Link from 'next/link';
import Button from 'components/ui/Button';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <section className="py-16 px-4 border-b border-neutral-100">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-4xl font-semibold text-neutral-800 mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
                        This Privacy Policy outlines how we collect, use, and protect your data.
                    </p>
                </div>
            </section>

            {/* Privacy Policy Content */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Introduction */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                            Introduction
                        </h2>
                        <p className="text-neutral-600 text-lg mb-4">
                            Your privacy is critically important to us. We only collect data necessary to provide and enhance our services while ensuring a seamless user experience.
                        </p>
                        <p className="text-neutral-600 text-lg">
                            By using our website, you agree to the terms of this Privacy Policy and any updates we may make.
                        </p>
                    </motion.div>

                    {/* Information We Collect */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                            Information We Collect
                        </h2>
                        <p className="text-neutral-600 text-lg mb-4">
                            We collect various types of data to optimize our service:
                        </p>
                        <ul className="list-disc pl-5 text-neutral-600 text-lg">
                            <li>
                                <strong>Personal Information:</strong> Such as your name, email address, and contact details.
                            </li>
                            <li>
                                <strong>Usage Data:</strong> Information about how you interact with our website.
                            </li>
                            <li>
                                <strong>Cookies and Tracking Technologies:</strong> Used to personalize your experience.
                            </li>
                        </ul>
                    </motion.div>

                    {/* How We Use Your Information */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                            How We Use Your Information
                        </h2>
                        <p className="text-neutral-600 text-lg mb-4">
                            The data we collect is used for several purposes, including:
                        </p>
                        <ul className="list-decimal pl-5 text-neutral-600 text-lg">
                            <li>Providing and maintaining our services.</li>
                            <li>Improving and personalizing your experience.</li>
                            <li>Communicating updates and special offers.</li>
                            <li>Ensuring the security and integrity of our systems.</li>
                        </ul>
                    </motion.div>

                    {/* Security */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                            Security
                        </h2>
                        <p className="text-neutral-600 text-lg">
                            We employ robust security measures to protect your data from unauthorized access, disclosure, alteration, and destruction.
                        </p>
                    </motion.div>

                    {/* Third-Party Services */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                            Third-Party Services
                        </h2>
                        <p className="text-neutral-600 text-lg mb-4">
                            We may share your data with trusted third-party services that help us operate our website, analyze usage, and enhance your experience.
                        </p>
                        <p className="text-neutral-600 text-lg">
                            These third parties are obligated to maintain the confidentiality and security of your data.
                        </p>
                    </motion.div>

                    {/* Contact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                            Contact Us
                        </h2>
                        <p className="text-neutral-600 text-lg">
                            If you have any questions or concerns about our Privacy Policy, please feel free to contact us at{' '}
                            <a
                                className="text-blue-600 hover:text-blue-800 underline"
                                href="mailto:privacy@example.com"
                            >
                                privacy@example.com
                            </a>.
                        </p>
                    </motion.div>

                    {/* Return Button */}
                    <div className="text-center">
                        <Button variant="primary" className="px-6 py-3">
                            <Link href="/">Return to Homepage</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
