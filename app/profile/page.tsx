'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Button from 'components/ui/Button';
import MCPCard from 'components/MCPCard';
import { MCP } from 'types/mcp';
import { FaKey } from 'react-icons/fa';

export default function Profile() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'mcps' | 'apikeys'>('profile');
    const [userMcps, setUserMcps] = useState<MCP[]>([]);
    const [mcpsLoading, setMcpsLoading] = useState<boolean>(true);
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
                await fetchUserMcps(session.user.id);
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

    const fetchUserMcps = async (userId: string) => {
        setMcpsLoading(true);
        try {
            const { data, error } = await supabase
                .from('mcps')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching user MCPs:', error);
                toast.error('Failed to load your MCPs');
                setUserMcps([]);
            } else {
                setUserMcps(data || []);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred while loading your MCPs');
        } finally {
            setMcpsLoading(false);
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

    const handleDeleteMcp = async (id: string) => {
        if (!session?.user) return;

        try {
            const { error } = await supabase
                .from('mcps')
                .delete()
                .eq('id', id);

            if (error) {
                throw error;
            }

            // Update the local state to remove the deleted MCP
            setUserMcps(userMcps.filter(mcp => mcp.id !== id));
            toast.success('MCP deleted successfully');
        } catch (error: any) {
            console.error('Error deleting MCP:', error);
            toast.error(`Failed to delete MCP: ${error.message}`);
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

                    {/* Profile Info and Navigation Tabs */}
                    <div className="pt-20 md:pt-24 px-6 md:px-10 pb-8">
                        <div className="text-center mb-6">
                            <p className="text-sm text-neutral-500">
                                {session?.user?.email}
                            </p>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex border-b border-neutral-200 mb-6">
                            <button
                                className={`py-3 px-4 font-medium text-sm ${activeTab === 'profile'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-neutral-500 hover:text-neutral-800'
                                    }`}
                                onClick={() => setActiveTab('profile')}
                            >
                                Profile Details
                            </button>
                            <button
                                className={`py-3 px-4 font-medium text-sm ${activeTab === 'mcps'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-neutral-500 hover:text-neutral-800'
                                    }`}
                                onClick={() => setActiveTab('mcps')}
                            >
                                My MCPs
                            </button>
                            <button
                                className={`py-3 px-4 font-medium text-sm ${activeTab === 'apikeys'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-neutral-500 hover:text-neutral-800'
                                    }`}
                                onClick={() => setActiveTab('apikeys')}
                            >
                                API Keys
                            </button>
                        </div>

                        {/* Profile Tab Content */}
                        {activeTab === 'profile' && (
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
                        )}

                        {/* MCPs Tab Content */}
                        {activeTab === 'mcps' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-neutral-800">Your MCPs</h2>
                                    <Button
                                        variant="primary"
                                        className="px-4 py-2"
                                        onClick={() => router.push('/admin/mcps')}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 mr-2"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Add New MCP
                                    </Button>
                                </div>

                                {mcpsLoading ? (
                                    <div className="flex justify-center items-center py-12">
                                        <div className="w-10 h-10 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
                                    </div>
                                ) : userMcps.length === 0 ? (
                                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-12 w-12 mx-auto text-neutral-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <h3 className="mt-4 text-lg font-medium text-neutral-700">No MCPs Found</h3>
                                        <p className="mt-2 text-neutral-500">
                                            You haven't submitted any MCPs yet.
                                        </p>
                                        <Button
                                            variant="primary"
                                            className="mt-6 px-4 py-2"
                                            onClick={() => router.push('/admin/mcps')}
                                        >
                                            Submit Your First MCP
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {userMcps.map((mcp) => (
                                            <MCPCard
                                                key={mcp.id}
                                                mcp={mcp}
                                                onClick={() => router.push(`/mcp/${mcp.id}`)}
                                                editable
                                                onDelete={() => handleDeleteMcp(mcp.id!)}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className="mt-8 pt-6 border-t border-neutral-200">
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
                                </div>
                            </div>
                        )}

                        {/* API Keys Tab Content */}
                        {activeTab === 'apikeys' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-neutral-800">Your API Keys</h2>
                                    <Button
                                        variant="primary"
                                        className="px-4 py-2"
                                        onClick={() => router.push('/profile/apikeys')}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 mr-2"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                        </svg>
                                        Manage API Keys
                                    </Button>
                                </div>
                                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6">
                                    <div className="flex items-center">
                                        <div className="mr-4 text-blue-500">
                                            <FaKey className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-neutral-800">Access the MCPH API</h3>
                                            <p className="mt-1 text-neutral-600">
                                                Create and manage API keys to access MCPH resources programmatically.
                                            </p>
                                            <Button
                                                variant="outline"
                                                className="mt-3"
                                                onClick={() => router.push('/profile/apikeys')}
                                            >
                                                Manage Keys
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
