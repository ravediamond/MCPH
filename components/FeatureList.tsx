'use client';

import { Box, SimpleGrid, Text, Icon } from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';

export default function FeatureList() {
    const features = [
        'Universal integration for AI tools',
        'Seamless API connectivity',
        'Built with Next.js 13 and TypeScript',
    ];

    return (
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mt={6}>
            {features.map((feature, index) => (
                <Box
                    key={index}
                    borderWidth="1px"
                    borderRadius="lg"
                    p={4}
                    textAlign="center"
                    _hover={{ shadow: 'md' }}
                >
                    <Icon as={CheckCircleIcon} color="green.500" w={6} h={6} mb={2} />
                    <Text fontWeight="bold">{feature}</Text>
                </Box>
            ))}
        </SimpleGrid>
    );
}
