'use client';

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
} from '@chakra-ui/react';
import { supabase } from '../lib/supabaseClient';

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
                <ModalContent>
                    <ModalHeader>Login with GitHub</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text>
                            Proceed to login with your GitHub account by clicking the button
                            below.
                        </Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            colorScheme="blue"
                            mr={3}
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
