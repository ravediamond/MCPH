'use client';

import Link from 'next/link';
import Button from 'components/ui/Button';
import { motion } from 'framer-motion';

export default function TermsPage() {
    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <section className="py-16 px-4 border-b border-neutral-100">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-4xl font-semibold text-neutral-800 mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
                        Please read these Terms carefully before using our website. Your use of the site indicates your acceptance of these terms.
                    </p>
                </div>
            </section>

            {/* Terms Content */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    {/* 1. Acceptance of Terms */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                            1. Acceptance of Terms
                        </h2>
                        <p className="text-neutral-600 text-lg">
                            By accessing and using this website, you agree to be bound by these Terms. If you do not agree to these Terms, please refrain from using our website.
                        </p>
                    </motion.div>

                    {/* 2. Modifications to Terms */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                            2. Modifications to Terms
                        </h2>
                        <p className="text-neutral-600 text-lg">
                            We reserve the right to modify these Terms at any time. Any updates will be posted on this page with an updated effective date. Continued use of the website constitutes acceptance of the revised Terms.
                        </p>
                    </motion.div>

                    {/* 3. Use of the Website */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                            3. Use of the Website
                        </h2>
                        <p className="text-neutral-600 text-lg">
                            You agree to use the website only for lawful purposes and in a manner that does not infringe the rights of, or restrict, or inhibit the use and enjoyment of the website by any third party.
                        </p>
                    </motion.div>

                    {/* 4. User Responsibilities */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                            4. User Responsibilities
                        </h2>
                        <p className="text-neutral-600 text-lg mb-4">
                            You are solely responsible for any content you post or share on the website. You agree not to transmit any viruses, malware, or other harmful code, and to report any violations of these Terms.
                        </p>
                    </motion.div>

                    {/* 5. Intellectual Property */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                            5. Intellectual Property
                        </h2>
                        <p className="text-neutral-600 text-lg">
                            All content on this website, including text, graphics, logos, images, and software, is the property of its respective owners and is protected by applicable copyright and trademark laws. Unauthorized use or distribution of the content is prohibited.
                        </p>
                    </motion.div>

                    {/* 6. Termination */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                            6. Termination
                        </h2>
                        <p className="text-neutral-600 text-lg">
                            We reserve the right to terminate or suspend your access to the website at any time, without notice, for conduct that we believe violates these Terms or is harmful to other users, our business, or third parties.
                        </p>
                    </motion.div>

                    {/* 7. Governing Law */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                            7. Governing Law
                        </h2>
                        <p className="text-neutral-600 text-lg">
                            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which our company is established, without regard to its conflict of laws rules.
                        </p>
                    </motion.div>

                    {/* 8. Contact Information */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                        className="mb-12"
                    >
                        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                            8. Contact Information
                        </h2>
                        <p className="text-neutral-600 text-lg">
                            If you have any questions about these Terms, please contact us at{' '}
                            <a className="text-blue-600 hover:text-blue-800 underline" href="mailto:support@example.com">
                                support@example.com
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
