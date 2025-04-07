import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import Head from 'next/head';

export default function Dashboard() {
    const { user, signOut } = useAuth();

    return (
        <ProtectedRoute>
            <Head>
                <title>Dashboard | MCPHub</title>
            </Head>
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold">Dashboard</h1>
                            <button
                                onClick={signOut}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                            >
                                Sign Out
                            </button>
                        </div>

                        <div className="border-t pt-4">
                            <p className="font-medium">Welcome, {user?.user_metadata?.name || user?.email || 'User'}</p>
                            <p className="text-sm text-gray-500 mt-2">
                                You're signed in with GitHub
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
