'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../types/database.types';

// Define the context shape
type SupabaseContextType = {
    supabase: SupabaseClient;
    session: Session | null;
};

// Create the context with a default value
const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

// Provider component to wrap app with
export default function SupabaseProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [session, setSession] = useState<Session | null>(null);
    // Use createClientComponentClient instead of standard client
    const supabase = createClientComponentClient<Database>();

    useEffect(() => {
        // Log initialization of provider
        console.log('Initializing Supabase provider');

        // Get initial session
        const fetchSession = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    console.error('Error fetching session:', error);
                    return;
                }

                setSession(data.session);
                console.log("Session check:", data.session ? "User authenticated" : "No authenticated user");
            } catch (err) {
                console.error('Unexpected error fetching session:', err);
            }
        };

        fetchSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
            console.log('Auth state change event:', event);
            setSession(newSession);

            // Log detailed session information for debugging
            if (newSession) {
                console.log('User authenticated:', newSession.user?.email);
                console.log('Session expires at:', new Date(newSession.expires_at! * 1000).toLocaleString());
            } else {
                console.log('No active session');
            }
        });

        // Cleanup on unmount
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <SupabaseContext.Provider value={{ supabase, session }}>
            {children}
        </SupabaseContext.Provider>
    );
}

// Hook to use the Supabase context
export const useSupabase = () => {
    const context = useContext(SupabaseContext);
    if (context === undefined) {
        throw new Error('useSupabase must be used within a SupabaseProvider');
    }
    return context;
};