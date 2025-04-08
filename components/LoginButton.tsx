'use client';

import { Button } from '@chakra-ui/react';
import { supabase } from '../lib/supabaseClient';

export default function LoginButton() {
    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github'
        });
        if (error) {
            console.error('Login error:', error);
        }
    };

    return (
        <Button colorScheme="blue" onClick={handleLogin}>
            Login with GitHub
        </Button>
    );
}
