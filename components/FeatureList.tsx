'use client';

import { Box, List, ListItem, ListIcon } from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';

export default function FeatureList() {
    const features = [
        'Universal integration for AI tools',
        'Seamless API connectivity',
        'GitHub authentication via Supabase',
        'Built with Next.js 13 and TypeScript',
        'Chakra UI for a beautiful interface'
    ];

    return (
        <Box my={8}>
            <List spacing={3}>
                {features.map((feature, index) => (
                    <ListItem key={index}>
                        <ListIcon as={CheckCircleIcon} color="green.500" />
                        {feature}
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}
