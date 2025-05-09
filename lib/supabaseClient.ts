// import { createClient } from '@supabase/supabase-js';
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// import type { Database } from '../types/database.types';

// // Check if Supabase is configured
// const isSuapbaseConfigured =
//     process.env.NEXT_PUBLIC_SUPABASE_URL &&
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// // Only initialize if environment variables are present
// let supabase = undefined;
// try {
//     if (isSuapbaseConfigured) {
//         supabase = createClientComponentClient<Database>();
//     }
// } catch (error) {
//     console.warn('Failed to initialize Supabase client:', error);
// }

// // Conditional helper function for creating new client instances
// const createClientSupabase = () => {
//     if (!isSuapbaseConfigured) {
//         console.warn('Supabase is not configured. Using file-sharing service without Supabase.');
//         return null;
//     }

//     return createClientComponentClient<Database>();
// };

// // Create a server-side client with service role for admin functions
// const createServiceRoleClient = () => {
//     const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
//     const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

//     if (!supabaseUrl || !supabaseServiceRoleKey) {
//         console.warn('Missing required environment variables for Supabase service role client.');
//         return null;
//     }

//     return createClient<Database>(
//         supabaseUrl,
//         supabaseServiceRoleKey,
//         {
//             auth: {
//                 persistSession: false,
//                 autoRefreshToken: false,
//             }
//         }
//     );
// };

// export { supabase, createClientSupabase, createServiceRoleClient };
