import React from 'react';
import {
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Text,
    useDisclosure,
    Icon,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabaseClient';
import { FaGithub } from 'react-icons/fa';
import { ElementType } from 'react';

export default function LoginModal() {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: 'http://localhost:3000/dashboard',
            },
        });
        if (error) {
            console.error('Login error:', error);
        }
    };

    return (
        <>
            <Button colorScheme="blue" onClick={onOpen}>
                Login
            </Button>

            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent borderRadius="lg" boxShadow="xl">
                    <ModalHeader borderBottomWidth="1px">Login with GitHub</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text mb={4}>
                            Proceed to login with your GitHub account by clicking the button below.
                        </Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            // Overriding the styling to use a GitHub-like color
                            bg="#24292e"
                            color="white"
                            mr={3}
                            _hover={{ bg: "#1b1f23" }}
                            _active={{ bg: "#141619" }}
                            leftIcon={
                                <Icon as={FaGithub as unknown as ElementType} />
                            }
                            onClick={() => {
                                handleLogin();
                                onClose();
                            }}
                        >
                            Continue with GitHub
                        </Button>
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
