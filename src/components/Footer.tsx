import { Box, Container, Link, Stack, Text } from '@chakra-ui/react';

const Footer = () => {
    return (
        <Box bg="gray.50" color="gray.700" as="footer" mt="auto" py={4}>
            <Container maxW="container.xl">
                <Stack
                    direction={{ base: 'column', md: 'row' }}
                    spacing={4}
                    justify="space-between"
                    align="center"
                >
                    <Text>© {new Date().getFullYear()} MCP Registry</Text>
                    <Stack direction="row" spacing={6}>
                        <Link href="/about">About</Link>
                        <Link href="/privacy">Privacy</Link>
                        <Link href="/terms">Terms</Link>
                        <Link href="https://github.com/your-username/mcp-registry" isExternal>
                            GitHub
                        </Link>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
};

export default Footer;
