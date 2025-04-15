'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from 'lib/supabaseClient';

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

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
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