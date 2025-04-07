import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import {
    Button,
    FormControl,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Stack,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    useToast,
} from '@chakra-ui/react';

type AuthModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const supabaseClient = useSupabaseClient();
    const toast = useToast();

    const handleSignIn = async () => {
        setLoading(true);
        const { error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        setLoading(false);
        if (error) {
            toast({
                title: 'Error signing in',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } else {
            toast({
                title: 'Signed in successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            onClose();
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        const { error } = await supabaseClient.auth.signUp({
            email,
            password,
        });

        setLoading(false);
        if (error) {
            toast({
                title: 'Error signing up',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } else {
            toast({
                title: 'Check your email',
                description: 'We sent you a confirmation link',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Account Access</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Tabs isFitted variant="enclosed">
                        <TabList mb="1em">
                            <Tab>Sign In</Tab>
                            <Tab>Sign Up</Tab>
                        </TabList>
                        <TabPanels>
                            <TabPanel>
                                <Stack spacing={4}>
                                    <FormControl>
                                        <FormLabel>Email</FormLabel>
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>Password</FormLabel>
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </FormControl>
                                    <Button
                                        colorScheme="brand"
                                        onClick={handleSignIn}
                                        isLoading={loading}
                                    >
                                        Sign In
                                    </Button>
                                </Stack>
                            </TabPanel>
                            <TabPanel>
                                <Stack spacing={4}>
                                    <FormControl>
                                        <FormLabel>Email</FormLabel>
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>Password</FormLabel>
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </FormControl>
                                    <Button
                                        colorScheme="brand"
                                        onClick={handleSignUp}
                                        isLoading={loading}
                                    >
                                        Sign Up
                                    </Button>
                                </Stack>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </ModalBody>
                <ModalFooter />
            </ModalContent>
        </Modal>
    );
};

export default AuthModal;
