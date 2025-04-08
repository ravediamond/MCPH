import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Flex, Text } from '@chakra-ui/react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/signin');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <Flex minH="100vh" align="center" justify="center">
                <Text fontSize="lg">Loading...</Text>
            </Flex>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
