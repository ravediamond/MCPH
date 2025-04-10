'use client';

import SearchBar from 'components/SearchBar';
import FeatureList from 'components/FeatureList';
import LoginModal from 'components/LoginModal';


export default function Home() {
    return (
        <div className="container mx-auto max-w-screen-lg py-16">
            <div className="flex flex-col gap-12 items-stretch">
                {/* Hero Section */}
                <div className="text-center py-10">
                    <h1 className="text-5xl font-bold mb-4">
                        MCPH
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Welcome to MCPH, your one-stop hub for discovering, sharing, and exploring Model Context Protocol (MCP) tools. Whether you're a developer or an AI system, MCPH simplifies the process of integration and innovation.
                    </p>
                </div>

                {/* Search Section */}
                <div className="text-center">
                    <SearchBar />
                </div>

                {/* Features Section */}
                <div className="text-center">
                    <h2 className="text-4xl font-bold mb-6">
                        Explore Our Key Features
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
                        Discover a range of functionalities designed to enhance your MCP experience. Our platform ensures you can securely authenticate, seamlessly integrate GitHub repositories, and tap into a robust API for AI-powered interactions.
                    </p>
                    <FeatureList />
                </div>

                <hr className="border-gray-200" />

                {/* How It Works Section */}
                <div className="text-center py-6">
                    <h2 className="text-4xl font-bold mb-4">
                        How It Works
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
                        Getting started with MCPH is simple and straightforward. Follow these steps to become part of our growing community:
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <div className="p-4">
                            <h3 className="text-lg font-medium mb-2">
                                1. Sign Up & Profile Setup
                            </h3>
                            <p className="text-md text-gray-500">
                                Create your account and easily manage your profile.
                            </p>
                        </div>
                        <div className="p-4">
                            <h3 className="text-lg font-medium mb-2">
                                2. Submit Your MCP
                            </h3>
                            <p className="text-md text-gray-500">
                                Connect your GitHub repository to automatically import your README and documentation.
                            </p>
                        </div>
                        <div className="p-4">
                            <h3 className="text-lg font-medium mb-2">
                                3. Explore & Integrate
                            </h3>
                            <p className="text-md text-gray-500">
                                Search our catalog to find and integrate the right tools for your projects.
                            </p>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* Call to Action Section */}
                <div className="text-center">
                    <h2 className="text-4xl font-bold mb-4">
                        Ready to Get Started?
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                        Join our community today and harness the full potential of the Model Context Protocol. Dive into a platform that makes integrations seamless and innovation unstoppable.
                    </p>
                    <div className="flex justify-center">
                        <LoginModal />
                    </div>
                </div>
            </div>
        </div>
    );
}