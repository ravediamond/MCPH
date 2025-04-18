'use client';

import Link from 'next/link';
import Button from 'components/ui/Button';
import { motion } from 'framer-motion';

export default function About() {
    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <section className="py-16 px-4 border-b border-neutral-100">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-4xl font-semibold text-neutral-800 mb-4">
                        About MCPHub
                    </h1>
                    <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
                        Empowering innovation and efficiency through advanced management solutions
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="md:w-1/2"
                        >
                            <h2 className="text-3xl font-semibold text-neutral-800 mb-4">Our Mission</h2>
                            <p className="text-lg text-neutral-600 mb-4">
                                At MCPHub, we believe in transforming complex processes into intuitive experiences.
                                Our mission is to provide cutting-edge solutions that empower organizations to achieve their full potential through streamlined operations and data-driven insights.
                            </p>
                            <p className="text-lg text-neutral-600">
                                Founded in 2023, we have consistently pushed the boundaries of what's possible in the industry,
                                setting new standards for excellence and innovation.
                            </p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="md:w-1/2 rounded-lg overflow-hidden shadow-sm"
                        >
                            <div className="aspect-video relative bg-gray-100 flex items-center justify-center">
                                <span className="text-2xl font-semibold text-neutral-800">MCPHub</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
}
