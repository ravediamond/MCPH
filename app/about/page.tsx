'use client';

import Link from 'next/link';
import Button from 'components/ui/Button';
import { motion } from 'framer-motion';
import { FaRocket, FaLightbulb, FaUsers, FaCogs } from 'react-icons/fa';

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

            {/* Features Section */}
            <section className="py-16 bg-white">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-semibold text-neutral-800 mb-4">What Makes Us Different</h2>
                        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                            Our unique approach combines cutting-edge technology with human-centered design to deliver exceptional results for our clients.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: <FaRocket className="text-4xl text-blue-500 mb-4" />,
                                title: "Innovation",
                                description: "Constantly pushing boundaries to deliver forward-thinking solutions",
                            },
                            {
                                icon: <FaLightbulb className="text-4xl text-yellow-500 mb-4" />,
                                title: "Expertise",
                                description: "Deep industry knowledge and technical excellence in our domain",
                            },
                            {
                                icon: <FaUsers className="text-4xl text-green-500 mb-4" />,
                                title: "Collaboration",
                                description: "Working closely with clients to ensure tailored solutions",
                            },
                            {
                                icon: <FaCogs className="text-4xl text-purple-500 mb-4" />,
                                title: "Reliability",
                                description: "Dependable systems that deliver consistent performance",
                            },
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="bg-white border border-neutral-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300 text-center"
                            >
                                {feature.icon}
                                <h3 className="text-xl font-semibold text-neutral-800 mb-2">{feature.title}</h3>
                                <p className="text-neutral-600 text-sm">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-16 bg-white">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-semibold text-neutral-800 mb-4">Our Leadership Team</h2>
                        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                            Meet the talented individuals behind MCPHub's vision and success.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                name: "Alex Johnson",
                                role: "Chief Executive Officer",
                                bio: "Visionary leader with over 15 years of experience in technology innovation.",
                            },
                            {
                                name: "Jamie Smith",
                                role: "Chief Technology Officer",
                                bio: "Expert in distributed systems and cutting-edge infrastructure solutions.",
                            },
                            {
                                name: "Morgan Chen",
                                role: "Head of Design",
                                bio: "Award-winning designer focused on creating intuitive user experiences.",
                            },
                        ].map((member, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="bg-white border border-neutral-100 rounded-lg p-6 shadow-sm hover:shadow-md"
                            >
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                                    {member.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-semibold text-neutral-800 mb-1">{member.name}</h3>
                                    <p className="text-blue-600 mb-3">{member.role}</p>
                                    <p className="text-neutral-600 text-sm">{member.bio}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact CTA */}
            <section className="py-16 bg-blue-600">
                <div className="max-w-5xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-semibold text-white mb-4">Ready to transform your workflow?</h2>
                    <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                        Get in touch with our team to discover how MCPHub can help your organization thrive.
                    </p>
                    <Button variant="primary" className="px-8 py-3">
                        Contact Us
                    </Button>
                </div>
            </section>
        </div>
    );
}
