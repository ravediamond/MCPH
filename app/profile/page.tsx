'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from 'lib/supabaseClient';
import toast from 'react-hot-toast';
import Image from 'next/image';


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
    }, []);

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
                    id: userId,
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

            // Using react-hot-toast's API
            toast.success('Profile updated', { duration: 3000 });
        } catch (error: any) {
            toast.error(`Error updating profile: ${error.message}`, { duration: 3000 });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="spinner" />
                {/* You can replace <div className="spinner" /> with your own spinner */}
            </div>
        );
    }

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <div className="space-y-8">
                <h1 className="text-center text-3xl font-bold">My Profile</h1>

                <div className="flex flex-col items-center mb-6">
                    <img
                        src="/path/to/avatar.jpg"
                        alt={profile.full_name || session?.user?.email}
                        className="rounded-full h-24 w-24 mb-4"
                    />
                    <p className="text-lg text-gray-500">{session?.user?.email}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="full_name"
                            value={profile.full_name || ''}
                            onChange={handleChange}
                            placeholder="Your full name"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={profile.username || ''}
                            onChange={handleChange}
                            placeholder="Your username"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                            Bio
                        </label>
                        <textarea
                            name="bio"
                            value={profile.bio || ''}
                            onChange={handleChange}
                            placeholder="Tell us about yourself"
                            rows={4}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                            Website
                        </label>
                        <input
                            type="url"
                            name="website"
                            value={profile.website || ''}
                            onChange={handleChange}
                            placeholder="https://your-website.com"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex justify-between mt-6">
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard')}
                            className="px-4 py-2 border rounded-md"
                        >
                            Back to Dashboard
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md"
                            disabled={saving}
                        >
                            {saving ? 'Saving' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
