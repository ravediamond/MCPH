'use client';

import { useState } from 'react';
import { Input, InputGroup, InputRightElement, IconButton } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

export default function SearchBar() {
    const [query, setQuery] = useState('');

    const handleSearch = () => {
        // Implement your search functionality here
        console.log(`Search for: ${query}`);
    };

    return (
        <InputGroup size="md" mb={8}>
            <Input
                pr="4.5rem"
                type="text"
                placeholder="Search features..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <InputRightElement width="4.5rem">
                <IconButton
                    h="1.75rem"
                    size="sm"
                    aria-label="Search database"
                    icon={<SearchIcon />}
                    onClick={handleSearch}
                />
            </InputRightElement>
        </InputGroup>
    );
}
