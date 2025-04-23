'use client';

export default function FAQPage() {
    return (
        <div className="bg-white min-h-screen p-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>

            <div className="space-y-8">
                <section className="border-b border-gray-200 pb-6">
                    <h2 className="text-2xl font-semibold mb-6">About MCP</h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-medium mb-2">What is Model Context Protocol (MCP)?</h3>
                            <p className="text-lg text-gray-700">
                                Model Context Protocol (MCP) is an open protocol that standardizes how applications provide
                                context to Large Language Models (LLMs). It allows LLMs to safely access external data
                                sources, tools, and services through a standardized interface.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-medium mb-2">What is MCPH?</h3>
                            <p className="text-lg text-gray-700">
                                MCPH is a platform for discovering, sharing, and using MCP implementations.
                                It serves as a central registry for MCP servers that enable AI models to interact
                                with various data sources and tools.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-medium mb-2">Which AI models support MCP?</h3>
                            <p className="text-lg text-gray-700">
                                MCP is designed to work with any AI platform that implements the protocol. Currently, it's
                                supported by Anthropic's Claude and various open-source AI frameworks. The list of supported
                                platforms is growing.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="border-b border-gray-200 pb-6">
                    <h2 className="text-2xl font-semibold mb-6">Using MCPs</h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-medium mb-2">How do I use an MCP with my AI application?</h3>
                            <p className="text-lg text-gray-700">
                                To use an MCP, you need to:
                            </p>
                            <ol className="list-decimal pl-6 mt-3 space-y-2 text-lg text-gray-700">
                                <li>Choose a compatible MCP from MCPH</li>
                                <li>Add the MCP endpoint to your AI system</li>
                                <li>Configure your AI model to utilize the MCP</li>
                            </ol>
                            <p className="mt-3 text-lg text-gray-700">
                                See our <a href="/docs/getting-started" className="text-blue-600 hover:underline">Getting Started</a> guide for details.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-medium mb-2">Can I use multiple MCPs with a single AI application?</h3>
                            <p className="text-lg text-gray-700">
                                Yes, you can connect multiple MCPs to your AI application, allowing it to access
                                various capabilities and data sources simultaneously.
                            </p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-6">Creating MCPs</h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-medium mb-2">How do I publish my MCP to MCPH?</h3>
                            <p className="text-lg text-gray-700">
                                To publish your MCP:
                            </p>
                            <ol className="list-decimal pl-6 mt-3 space-y-2 text-lg text-gray-700">
                                <li>Create an account on MCPH</li>
                                <li>Prepare your MCP with proper documentation</li>
                                <li>Use our web interface or API to submit it</li>
                            </ol>
                        </div>

                        <div>
                            <h3 className="text-xl font-medium mb-2">What capabilities can an MCP provide?</h3>
                            <p className="text-lg text-gray-700">
                                MCPs can provide various capabilities, including:
                            </p>
                            <ul className="list-disc pl-6 mt-3 space-y-2 text-lg text-gray-700">
                                <li>Access to databases and data stores</li>
                                <li>Web API integrations</li>
                                <li>File system access</li>
                                <li>Domain-specific tools and calculations</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}