import { NextResponse } from 'next/server';
import { supabase } from 'lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { Database } from 'types/database.types';

// Define types for tag export
interface TagExport {
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
}

interface CategoryExport {
    id: number;
    name: string;
    description: string | null;
}

interface TagExportData {
    metadata: {
        exportDate: string;
        totalTags: number;
        totalCategories: number;
    };
    categories: CategoryExport[];
    tagsByCategory: Record<string, TagExport[]>;
}

/**
 * GET /api/tags/export
 * Exports all tags with their categories as a downloadable JSON file
 * This endpoint requires admin privileges
 */
export async function GET(request: Request) {
    try {
        // Check for authorization header first
        const authHeader = request.headers.get('Authorization');
        let session;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            // Extract token from Authorization header
            const token = authHeader.substring(7);

            // Create a temp Supabase client with the access token
            const supabaseWithAuth = createClient<Database>(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            );

            // Set the auth token for this client
            const { data, error } = await supabaseWithAuth.auth.getUser(token);
            if (error || !data?.user) {
                return NextResponse.json(
                    { error: 'Invalid authorization token' },
                    { status: 401 }
                );
            }

            // Check if user is admin
            const { data: profile } = await supabaseWithAuth
                .from('profiles')
                .select('is_admin')
                .eq('id', data.user.id)
                .single();

            if (!profile?.is_admin) {
                return NextResponse.json(
                    { error: 'Admin privileges required' },
                    { status: 403 }
                );
            }

            // Use this client for subsequent operations
            const { data: categories, error: categoriesError } = await supabaseWithAuth
                .from('tag_categories')
                .select('*')
                .order('name');

            if (categoriesError) {
                console.error('Error fetching tag categories:', categoriesError);
                return NextResponse.json(
                    { error: 'Failed to retrieve tag categories' },
                    { status: 500 }
                );
            }

            // Fetch all tags with their categories
            const { data: tags, error: tagsError } = await supabaseWithAuth
                .from('tags')
                .select('*, tag_category:tag_categories(id, name, description)')
                .order('category_id, name');

            if (tagsError) {
                console.error('Error fetching tags:', tagsError);
                return NextResponse.json(
                    { error: 'Failed to retrieve tags' },
                    { status: 500 }
                );
            }

            // Group tags by category
            const tagsByCategory: Record<string, TagExport[]> = {};

            categories.forEach(category => {
                tagsByCategory[category.name] = tags
                    .filter(tag => tag.category_id === category.id)
                    .map(tag => ({
                        id: tag.id,
                        name: tag.name,
                        description: tag.description,
                        icon: tag.icon || null
                    }));
            });

            // Create export data with metadata
            const exportData: TagExportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    totalTags: tags.length,
                    totalCategories: categories.length
                },
                categories: categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    description: cat.description
                })),
                tagsByCategory
            };

            // Set headers for file download
            const headers = new Headers();
            headers.append('Content-Disposition', 'attachment; filename="mcphub-tags-export.json"');
            headers.append('Content-Type', 'application/json');

            // Return data as downloadable JSON file
            return new NextResponse(JSON.stringify(exportData, null, 2), {
                status: 200,
                headers
            });
        } else {
            // Fall back to session-based auth if no valid Authorization header
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                return NextResponse.json(
                    { error: 'Authentication required' },
                    { status: 401 }
                );
            }

            // Check if user is an admin
            const { data: user } = await supabase.auth.getUser();
            const userId = user.user?.id;

            if (!userId) {
                return NextResponse.json(
                    { error: 'User ID not found' },
                    { status: 401 }
                );
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', userId)
                .single();

            if (!profile?.is_admin) {
                return NextResponse.json(
                    { error: 'Admin privileges required' },
                    { status: 403 }
                );
            }

            // Fetch all tag categories
            const { data: categories, error: categoriesError } = await supabase
                .from('tag_categories')
                .select('*')
                .order('name');

            if (categoriesError) {
                console.error('Error fetching tag categories:', categoriesError);
                return NextResponse.json(
                    { error: 'Failed to retrieve tag categories' },
                    { status: 500 }
                );
            }

            // Fetch all tags with their categories
            const { data: tags, error: tagsError } = await supabase
                .from('tags')
                .select('*, tag_category:tag_categories(id, name, description)')
                .order('category_id, name');

            if (tagsError) {
                console.error('Error fetching tags:', tagsError);
                return NextResponse.json(
                    { error: 'Failed to retrieve tags' },
                    { status: 500 }
                );
            }

            // Group tags by category
            const tagsByCategory: Record<string, TagExport[]> = {};

            categories.forEach(category => {
                tagsByCategory[category.name] = tags
                    .filter(tag => tag.category_id === category.id)
                    .map(tag => ({
                        id: tag.id,
                        name: tag.name,
                        description: tag.description,
                        icon: tag.icon || null
                    }));
            });

            // Create export data with metadata
            const exportData: TagExportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    totalTags: tags.length,
                    totalCategories: categories.length
                },
                categories: categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    description: cat.description
                })),
                tagsByCategory
            };

            // Set headers for file download
            const headers = new Headers();
            headers.append('Content-Disposition', 'attachment; filename="mcphub-tags-export.json"');
            headers.append('Content-Type', 'application/json');

            // Return data as downloadable JSON file
            return new NextResponse(JSON.stringify(exportData, null, 2), {
                status: 200,
                headers
            });
        }
    } catch (error) {
        console.error('Unexpected error in tags export API:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}