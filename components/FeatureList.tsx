'use client';

import { Box, SimpleGrid, Text, Icon, Heading } from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';

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
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mt={4}>
            {features.map((feature, index) => (
                <Box
                    key={index}
                    p={6}
                    borderWidth="1px"
                    borderRadius="md"
                    _hover={{ shadow: 'md' }}
                    textAlign="center"
                >
                    <Icon as={CheckCircleIcon} color="green.500" w={8} h={8} mb={4} />
                    <Heading as="h3" size="md" mb={2}>
                        {feature.title}
                    </Heading>
                    <Text fontSize="sm" color="gray.600">
                        {feature.description}
                    </Text>
                </Box>
            ))}
        </SimpleGrid>
    );
}
