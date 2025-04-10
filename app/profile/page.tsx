'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from 'lib/supabaseClient';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Heading,
    Input,
    VStack,
    Spinner,
    useToast,
    Text,
    Flex,
    Avatar,
    Textarea,
} from '@chakra-ui/react';

export default function Profile() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [profile, setProfile] = useState<any>({
        full_name: '',
        username: '',
        bio: '',
        website: '',
    });
    const router = useRouter();
    const toast = useToast();

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/');
            } else {
                setSession(session);
                await fetchProfile(session.user.id);
            }
            setLoading(false);
        };

        getSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (!session) {
                    router.push('/');
                } else {
                    setSession(session);
                }
            }
        );

        return () => {
            authListener.subscription?.unsubscribe();
        };
    }, [router]);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                // If profile doesn't exist, we'll create it when saving
                setProfile({
                    full_name: '',
                    username: '',
                    bio: '',
                    website: '',
                    id: userId
                });
            } else if (data) {
                setProfile(data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile({ ...profile, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.user) return;

        setSaving(true);

        const updates = {
            id: session.user.id,
            full_name: profile.full_name,
            username: profile.username,
            bio: profile.bio,
            website: profile.website,
            updated_at: new Date().toISOString(),
        };

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert(updates, { onConflict: 'id' });

            if (error) throw error;

            toast({
                title: 'Profile updated',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

        } catch (error: any) {
            toast({
                title: 'Error updating profile',
                description: error.message,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
            </Box>
        );
    }

    return (
        <Box p={8} maxWidth="800px" mx="auto">
            <VStack spacing={8} align="stretch">
                <Heading as="h1" size="xl" textAlign="center">
                    My Profile
                </Heading>

                <Flex direction="column" align="center" mb={6}>
                    <Avatar
                        size="2xl"
                        name={profile.full_name || session?.user?.email}
                        mb={4}
                    />
                    <Text fontSize="lg" color="gray.500">
                        {session?.user?.email}
                    </Text>
                </Flex>

                <form onSubmit={handleSubmit}>
                    <VStack spacing={6} align="stretch">
                        <FormControl id="fullName">
                            <FormLabel>Full Name</FormLabel>
                            <Input
                                type="text"
                                name="full_name"
                                value={profile.full_name || ''}
                                onChange={handleChange}
                                placeholder="Your full name"
                            />
                        </FormControl>

                        <FormControl id="username">
                            <FormLabel>Username</FormLabel>
                            <Input
                                type="text"
                                name="username"
                                value={profile.username || ''}
                                onChange={handleChange}
                                placeholder="Your username"
                            />
                        </FormControl>

                        <FormControl id="bio">
                            <FormLabel>Bio</FormLabel>
                            <Textarea
                                name="bio"
                                value={profile.bio || ''}
                                onChange={handleChange}
                                placeholder="Tell us about yourself"
                                rows={4}
                            />
                        </FormControl>

                        <FormControl id="website">
                            <FormLabel>Website</FormLabel>
                            <Input
                                type="url"
                                name="website"
                                value={profile.website || ''}
                                onChange={handleChange}
                                placeholder="https://your-website.com"
                            />
                        </FormControl>

                        <Flex justify="space-between" mt={6}>
                            <Button
                                onClick={() => router.push('/dashboard')}
                                variant="outline"
                            >
                                Back to Dashboard
                            </Button>
                            <Button
                                colorScheme="blue"
                                type="submit"
                                isLoading={saving}
                                loadingText="Saving"
                            >
                                Save Profile
                            </Button>
                        </Flex>
                    </VStack>
                </form>
            </VStack>
        </Box>
    );
}
