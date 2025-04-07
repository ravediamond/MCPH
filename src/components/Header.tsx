import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import {
    Box,
    Button,
    Flex,
    Heading,
    HStack,
    Link as ChakraLink,
    useDisclosure,
} from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AuthModal from './AuthModal';

const Header = () => {
    const router = useRouter();
    const supabaseClient = useSupabaseClient();
    const user = useUser();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const handleSignOut = async () => {
        await supabaseClient.auth.signOut();
        router.push('/');
    };

    return (
        <Box as="header" bg="white" boxShadow="sm">
            <Flex
                align="center"
                justify="space-between"
                py={4}
                px={[4, 6, 8]}
                maxW="1400px"
                mx="auto"
            >
                <Link href="/" passHref>
                    <ChakraLink _hover={{ textDecoration: 'none' }}>
                        <Heading size="md" color="brand.500">MCP Registry</Heading>
                    </ChakraLink>
                </Link>

                <HStack spacing={4}>
                    <Link href="/browse" passHref>
                        <ChakraLink>Browse</ChakraLink>
                    </Link>
                    <Link href="/docs" passHref>
                        <ChakraLink>Documentation</ChakraLink>
                    </Link>

                    {user ? (
                        <>
                            <Link href="/mcp/new" passHref>
                                <Button as="a" colorScheme="brand" size="sm">
                                    Submit MCP
                                </Button>
                            </Link>
                            <Button size="sm" variant="ghost" onClick={handleSignOut}>
                                Sign out
                            </Button>
                        </>
                    ) : (
                        <Button size="sm" colorScheme="brand" onClick={onOpen}>
                            Sign in
                        </Button>
                    )}
                </HStack>
            </Flex>

            <AuthModal isOpen={isOpen} onClose={onClose} />
        </Box>
    );
};

export default Header;
