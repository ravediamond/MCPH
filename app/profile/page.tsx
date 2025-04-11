'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from 'lib/supabaseClient';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Button from 'components/ui/Button';

export default function Profile() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    const [profile, setProfile] = useState<any>({
        full_name: '',
        username: '',
        bio: '',
        website: '',
        avatar_url: '',
    });
    const router = useRouter();

    useEffect(() => {
        const getSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
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
                setProfile({
                    full_name: '',
                    username: '',
                    bio: '',
                    website: '',
                    avatar_url: '',
                    id: userId,
                });
            } else if (data) {
                setProfile(data);
                if (data.avatar_url) setAvatarUrl(data.avatar_url);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setProfile({ ...profile, [name]: value });
    };

    const uploadAvatar = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }
            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${session.user.id}-${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(data.publicUrl);
            setProfile({
                ...profile,
                avatar_url: data.publicUrl,
            });

            toast.success('Avatar updated!');
        } catch (error: any) {
            toast.error(`Error uploading avatar: ${error.message}`);
        } finally {
            setUploading(false);
        }
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
            avatar_url: profile.avatar_url,
            updated_at: new Date().toISOString(),
        };

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert(updates, { onConflict: 'id' });
            if (error) throw error;

            toast.success('Profile updated successfully', {
                icon: '✅',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
        } catch (error: any) {
            toast.error(`Error updating profile: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-16 h-16 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
                <p className="mt-4 text-lg text-neutral-600">
                    Loading your profile...
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="p-4 md:p-8 max-w-5xl mx-auto"
            >
                <div className="bg-white border border-neutral-100 rounded-xl shadow-lg overflow-hidden">
                    {/* Header with Gradient & Avatar */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32 md:h-48 relative">
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="absolute -bottom-16 md:-bottom-20 left-1/2 transform -translate-x-1/2"
                        >
                            <div className="relative">
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                    {avatarUrl ? (
                                        <Image
                                            src={avatarUrl}
                                            alt={profile.full_name || 'Profile'}
                                            layout="fill"
                                            objectFit="cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                                            <span className="text-4xl text-neutral-400">
                                                {profile.full_name?.charAt(0)?.toUpperCase() ||
                                                    session?.user?.email?.charAt(0)?.toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <label
                                    htmlFor="avatar-upload"
                                    className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer shadow-md transition-all"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={uploadAvatar}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                </label>
                                {uploading && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                        <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Form Content */}
                    <div className="pt-20 md:pt-24 px-6 md:px-10 pb-8">
                        <div className="text-center mb-6">
                            <p className="text-sm text-neutral-500">
                                {session?.user?.email}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label
                                        htmlFor="fullName"
                                        className="block text-sm font-medium text-neutral-700"
                                    >
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        id="fullName"
                                        value={profile.full_name || ''}
                                        onChange={handleChange}
                                        placeholder="Your full name"
                                        className="block w-full px-4 py-3 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-lg shadow-sm transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label
                                        htmlFor="username"
                                        className="block text-sm font-medium text-neutral-700"
                                    >
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        id="username"
                                        value={profile.username || ''}
                                        onChange={handleChange}
                                        placeholder="Your username"
                                        className="block w-full px-4 py-3 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-lg shadow-sm transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="bio"
                                    className="block text-sm font-medium text-neutral-700"
                                >
                                    Bio
                                </label>
                                <textarea
                                    name="bio"
                                    id="bio"
                                    value={profile.bio || ''}
                                    onChange={handleChange}
                                    placeholder="Tell us about yourself"
                                    rows={4}
                                    className="block w-full px-4 py-3 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-lg shadow-sm transition-all resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="website"
                                    className="block text-sm font-medium text-neutral-700"
                                >
                                    Website
                                </label>
                                <input
                                    type="url"
                                    name="website"
                                    id="website"
                                    value={profile.website || ''}
                                    onChange={handleChange}
                                    placeholder="https://your-website.com"
                                    className="block w-full px-4 py-3 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-lg shadow-sm transition-all"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between pt-6 gap-4">
                                <Button
                                    variant="outline"
                                    className="px-6 py-3"
                                    onClick={() => router.push('/dashboard')}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 mr-2"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    Back to Dashboard
                                </Button>

                                <Button
                                    variant="primary"
                                    className={`px-6 py-3 flex items-center justify-center ${saving ? 'opacity-75 cursor-not-allowed' : ''
                                        }`}
                                    disabled={saving}
                                    type="submit"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                                            Saving Changes...
                                        </>
                                    ) : (
                                        <>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 mr-2"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            Save Profile
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
