'use client';

import { CheckIcon } from '@heroicons/react/24/solid';

export default function FeatureList() {
    const features = [
        {
            title: 'User Authentication',
            description:
                'Secure sign-up, login, and profile management. Keep your account safe while accessing your MCP data with ease.',
        },
        {
            title: 'GitHub Integration',
            description:
                'Effortlessly connect your GitHub repositories to automatically import documentation and README files for your MCPs.',
        },
        {
            title: 'Powerful API',
            description:
                'Utilize a robust RESTful API that allows AI systems and other integrations to seamlessly interact with our platform.',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            {features.map((feature, index) => (
                <div
                    key={index}
                    className="p-6 border rounded-md hover:shadow-md text-center transition-shadow"
                >
                    <CheckIcon className="w-8 h-8 mb-4 text-green-500 mx-auto" />
                    <h3 className="text-lg font-semibold mb-2">
                        {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                        {feature.description}
                    </p>
                </div>
            ))}
        </div>
    );
}
