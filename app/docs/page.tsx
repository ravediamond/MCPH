'use client';

import Link from 'next/link';
import Button from 'components/ui/Button';
import { motion } from 'framer-motion';

export default function DocsPage() {
    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <section className="py-16 px-4 border-b border-neutral-100">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-4xl font-semibold text-neutral-800 mb-4">
                        Documentation
                    </h1>
                    <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
                        Explore our guides, API reference, tutorials, and FAQs to learn how to integrate and get the most out of our platform.
                    </p>
                </div>
            </section>

            {/* Documentation Categories */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="grid gap-8 md:grid-cols-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="bg-white border border-neutral-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                        >
                            <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Getting Started</h2>
                            <p className="text-neutral-600 text-sm mb-4">
                                Learn how to quickly set up your project and integrate our services.
                            </p>
                            <Button variant="primary" size="sm" className="px-4 py-2">
                                <Link href="/docs/getting-started">Read More</Link>
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="bg-white border border-neutral-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                        >
                            <h2 className="text-2xl font-semibold text-neutral-800 mb-2">API Reference</h2>
                            <p className="text-neutral-600 text-sm mb-4">
                                Detailed documentation on our API endpoints, parameters, and usage examples.
                            </p>
                            <Button variant="primary" size="sm" className="px-4 py-2">
                                <Link href="/docs/api">Read More</Link>
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="bg-white border border-neutral-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                        >
                            <h2 className="text-2xl font-semibold text-neutral-800 mb-2">Tutorials</h2>
                            <p className="text-neutral-600 text-sm mb-4">
                                Step-by-step guides to help you implement our platform seamlessly.
                            </p>
                            <Button variant="primary" size="sm" className="px-4 py-2">
                                <Link href="/docs/tutorials">Read More</Link>
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="bg-white border border-neutral-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
                        >
                            <h2 className="text-2xl font-semibold text-neutral-800 mb-2">FAQ</h2>
                            <p className="text-neutral-600 text-sm mb-4">
                                Find answers to common questions and get troubleshooting tips.
                            </p>
                            <Button variant="primary" size="sm" className="px-4 py-2">
                                <Link href="/docs/faq">Read More</Link>
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
}
