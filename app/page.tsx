import { Container, Heading, Text } from '@chakra-ui/react';
import SearchBar from '../components/SearchBar';
import FeatureList from '../components/FeatureList';
import LoginButton from '../components/LoginButton';

export default function Home() {
    return (
        <Container maxW="container.lg" py={10}>
            <Heading as="h1" size="xl" mb={4}>MCP Hub</Heading>
            <Text mb={8}>
                Welcome to the Model Context Protocol hub – a universal format to integrate AI tools with external APIs.
            </Text>
            <SearchBar />
            <FeatureList />
            <LoginButton />
        </Container>
    );
}
