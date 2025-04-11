'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FaRocket, FaLightbulb, FaUsers, FaCogs } from 'react-icons/fa';

export default function About() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            {/* Hero Section */}
            <section className="relative h-[50vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-blue-600 opacity-70 z-0"></div>
                <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] bg-center z-0 opacity-20"></div>
                <div className="container mx-auto px-6 z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center"
                    >
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">About MCPHub</h1>
                        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
                            Empowering innovation and efficiency through advanced management solutions
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-20 bg-white dark:bg-gray-800">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="md:w-1/2"
                        >
                            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Our Mission</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
                                At MCPHub, we believe in transforming complex processes into intuitive experiences.
                                Our mission is to provide cutting-edge solutions that empower organizations to achieve
                                their full potential through streamlined operations and data-driven insights.
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 text-lg">
                                Founded in 2023, we have consistently pushed the boundaries of what's possible in
                                the industry, setting new standards for excellence and innovation.
                            </p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="md:w-1/2 rounded-lg overflow-hidden shadow-xl"
                        >
                            <div className="aspect-video relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <div className="text-white text-6xl">MCPHub</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">What Makes Us Different</h2>
                        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg">
                            Our unique approach combines cutting-edge technology with human-centered design to deliver
                            exceptional results for our clients.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: <FaRocket className="text-4xl text-blue-500 mb-4" />,
                                title: "Innovation",
                                description: "Constantly pushing boundaries to deliver forward-thinking solutions"
                            },
                            {
                                icon: <FaLightbulb className="text-4xl text-yellow-500 mb-4" />,
                                title: "Expertise",
                                description: "Deep industry knowledge and technical excellence in our domain"
                            },
                            {
                                icon: <FaUsers className="text-4xl text-green-500 mb-4" />,
                                title: "Collaboration",
                                description: "Working closely with clients to ensure tailored solutions"
                            },
                            {
                                icon: <FaCogs className="text-4xl text-purple-500 mb-4" />,
                                title: "Reliability",
                                description: "Dependable systems that deliver consistent performance"
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
                            >
                                <div className="flex flex-col items-center text-center">
                                    {feature.icon}
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{feature.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-20 bg-white dark:bg-gray-800">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Our Leadership Team</h2>
                        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg">
                            Meet the talented individuals behind MCPHub's vision and success.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                name: "Alex Johnson",
                                role: "Chief Executive Officer",
                                bio: "Visionary leader with over 15 years of experience in technology innovation."
                            },
                            {
                                name: "Jamie Smith",
                                role: "Chief Technology Officer",
                                bio: "Expert in distributed systems and cutting-edge infrastructure solutions."
                            },
                            {
                                name: "Morgan Chen",
                                role: "Head of Design",
                                bio: "Award-winning designer focused on creating intuitive user experiences."
                            }
                        ].map((member, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="bg-gray-50 dark:bg-gray-700 p-8 rounded-lg shadow-lg"
                            >
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                                    {member.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">{member.name}</h3>
                                    <p className="text-blue-600 dark:text-blue-400 mb-3">{member.role}</p>
                                    <p className="text-gray-600 dark:text-gray-300">{member.bio}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact CTA */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl font-bold mb-6">Ready to transform your workflow?</h2>
                        <p className="text-xl mb-8 max-w-2xl mx-auto">
                            Get in touch with our team to discover how MCPHub can help your organization thrive.
                        </p>
                        <Link
                            href="/contact"
                            className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                        >
                            Contact Us
                        </Link>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
