import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Review, ReviewSubmission } from 'types/mcp';
import { cachedFetch, cache } from 'utils/cacheUtils';

// Cache TTL for reviews (5 minutes)
const REVIEWS_CACHE_TTL = 5 * 60 * 1000;

// Create a cache key for reviews of a specific MCP
function createReviewsCacheKey(mcpId: string): string {
    return `reviews:${mcpId}`;
}

// Creates a cache key for user profile data
function createUserProfileCacheKey(userId: string): string {
    return `user-profile:${userId}`;
}

// GET endpoint to retrieve reviews for a specific MCP
export async function GET(request: NextRequest) {
    try {
        console.log('DEBUG Reviews GET: Starting request processing');
        const searchParams = request.nextUrl.searchParams;
        const mcpId = searchParams.get('mcp_id');
        console.log(`DEBUG Reviews GET: Requested MCP ID: ${mcpId}`);

        if (!mcpId) {
            console.log('DEBUG Reviews GET: Missing MCP ID parameter');
            return new NextResponse(
                JSON.stringify({ error: 'MCP ID is required' }),
                { status: 400 }
            );
        }

        // Create a cache key for this specific MCP's reviews
        const cacheKey = createReviewsCacheKey(mcpId);
        console.log(`DEBUG Reviews GET: Cache key created: ${cacheKey}`);

        // Check if we have this in cache already
        const cachedData = cache.get(cacheKey);
        console.log(`DEBUG Reviews GET: Cache hit? ${!!cachedData}`);

        // Use cachedFetch to avoid unnecessary database queries
        return cachedFetch(
            cacheKey,
            async () => {
                console.log('DEBUG Reviews GET: Cache miss, fetching data from Supabase');
                // Correctly initialize Supabase client with cookies as a function
                try {
                    console.log('DEBUG Reviews GET: Creating Supabase client');
                    const cookiesObj = cookies();
                    console.log(`DEBUG Reviews GET: Cookies available: ${!!cookiesObj}`);

                    const supabase = createRouteHandlerClient({ cookies: () => cookies() });
                    console.log('DEBUG Reviews GET: Supabase client created successfully');

                    // Execute all these queries in parallel to reduce wait time
                    console.log('DEBUG Reviews GET: Starting parallel database queries');
                    const [reviewsResponse, mcpStatsResponse] = await Promise.all([
                        // Fetch reviews
                        supabase
                            .from('reviews')
                            .select(`
                                id,
                                created_at,
                                updated_at,
                                mcp_id,
                                user_id,
                                rating,
                                comment
                            `)
                            .eq('mcp_id', mcpId)
                            .order('created_at', { ascending: false }),

                        // Fetch MCP stats
                        supabase
                            .from('mcps')
                            .select('avg_rating, review_count')
                            .eq('id', mcpId)
                            .single()
                    ]);

                    console.log('DEBUG Reviews GET: Database queries completed');
                    const { data: reviews, error: reviewsError } = reviewsResponse;
                    console.log(`DEBUG Reviews GET: Reviews count: ${reviews?.length || 0}`);
                    if (reviewsError) console.log(`DEBUG Reviews GET: Reviews error: ${reviewsError.message}`);

                    const { data: mcpData, error: mcpError } = mcpStatsResponse;
                    console.log(`DEBUG Reviews GET: MCP data: ${JSON.stringify(mcpData || {})}`);
                    if (mcpError) console.log(`DEBUG Reviews GET: MCP error: ${mcpError.message}`);

                    if (reviewsError) {
                        console.error('Error fetching reviews:', reviewsError);
                        throw new Error('Failed to fetch reviews');
                    }

                    // Collect all user IDs that we need to fetch
                    const userIds = new Set<string>();
                    if (reviews && reviews.length > 0) {
                        reviews.forEach(review => {
                            if (review.user_id) userIds.add(review.user_id);
                        });
                    }

                    // Fetch user profiles in bulk if we have reviews
                    const userProfiles: Record<string, any> = {};
                    if (userIds.size > 0) {
                        const userIdsArray = Array.from(userIds);

                        // Check cache first for each user profile
                        const uncachedUserIds = [];
                        for (const userId of userIdsArray) {
                            const userProfileKey = createUserProfileCacheKey(userId);
                            const cachedProfile = cache.get(userProfileKey);

                            if (cachedProfile) {
                                userProfiles[userId] = cachedProfile;
                            } else {
                                uncachedUserIds.push(userId);
                            }
                        }

                        // Only fetch profiles that aren't in cache
                        if (uncachedUserIds.length > 0) {
                            const { data: profiles, error: profilesError } = await supabase
                                .from('profiles')
                                .select('id, username, email')
                                .in('id', uncachedUserIds);

                            if (!profilesError && profiles) {
                                // Add fetched profiles to our mapping and cache them
                                profiles.forEach(profile => {
                                    userProfiles[profile.id] = profile;

                                    // Cache individual user profiles (1 hour TTL)
                                    const userProfileKey = createUserProfileCacheKey(profile.id);
                                    cache.set(userProfileKey, profile, { ttl: 60 * 60 * 1000 });
                                });
                            }
                        }
                    }

                    // Add user info to reviews
                    const reviewsWithUserInfo = reviews?.map(review => ({
                        ...review,
                        user: userProfiles[review.user_id] || null
                    })) || [];

                    // Calculate rating distribution more efficiently
                    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                    reviews?.forEach(review => {
                        if (review.rating >= 1 && review.rating <= 5) {
                            distribution[review.rating as 1 | 2 | 3 | 4 | 5]++;
                        }
                    });

                    console.log('DEBUG Reviews GET: Preparing response data');
                    return new NextResponse(
                        JSON.stringify({
                            reviews: reviewsWithUserInfo,
                            stats: {
                                avg_rating: mcpData?.avg_rating || 0,
                                review_count: mcpData?.review_count || 0,
                                rating_distribution: distribution
                            }
                        }),
                        { status: 200 }
                    );
                } catch (innerError) {
                    console.error('DEBUG Reviews GET: Error in data fetching:', innerError);
                    throw innerError;
                }
            },
            REVIEWS_CACHE_TTL
        );
    } catch (error) {
        console.error('DEBUG Reviews GET: Unexpected error:', error);
        return new NextResponse(
            JSON.stringify({ error: 'An unexpected error occurred', details: error instanceof Error ? error.message : String(error) }),
            { status: 500 }
        );
    }
}

// POST endpoint to add a new review
export async function POST(request: NextRequest) {
    try {
        // Correctly initialize Supabase client with cookies as a function
        const supabase = createRouteHandlerClient({ cookies: () => cookies() });

        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return new NextResponse(
                JSON.stringify({ error: 'Authentication required' }),
                { status: 401 }
            );
        }

        // Get the request body
        const body: ReviewSubmission = await request.json();

        if (!body.mcp_id || !body.rating || body.rating < 1 || body.rating > 5) {
            return new NextResponse(
                JSON.stringify({ error: 'Valid MCP ID and rating (1-5) are required' }),
                { status: 400 }
            );
        }

        // Check if the MCP exists and if the user has already reviewed it in parallel
        const [mcpCheck, existingReviewCheck] = await Promise.all([
            supabase
                .from('mcps')
                .select('id')
                .eq('id', body.mcp_id)
                .single(),

            supabase
                .from('reviews')
                .select('id')
                .eq('mcp_id', body.mcp_id)
                .eq('user_id', session.user.id)
                .single()
        ]);

        const { data: mcpExists, error: mcpError } = mcpCheck;
        const { data: existingReview } = existingReviewCheck;

        if (mcpError || !mcpExists) {
            return new NextResponse(
                JSON.stringify({ error: 'MCP not found' }),
                { status: 404 }
            );
        }

        let response;

        if (existingReview) {
            // Update existing review
            response = await supabase
                .from('reviews')
                .update({
                    rating: body.rating,
                    comment: body.comment || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingReview.id)
                .select();
        } else {
            // Insert new review
            response = await supabase
                .from('reviews')
                .insert({
                    mcp_id: body.mcp_id,
                    user_id: session.user.id,
                    rating: body.rating,
                    comment: body.comment || null
                })
                .select();
        }

        if (response.error) {
            console.error('Error saving review:', response.error);
            return new NextResponse(
                JSON.stringify({ error: 'Failed to save review' }),
                { status: 500 }
            );
        }

        // Invalidate the reviews cache for this MCP
        cache.delete(createReviewsCacheKey(body.mcp_id));

        return new NextResponse(
            JSON.stringify({
                success: true,
                review: response.data[0],
                message: existingReview ? 'Review updated successfully' : 'Review added successfully'
            }),
            { status: existingReview ? 200 : 201 }
        );
    } catch (error) {
        console.error('Unexpected error:', error);
        return new NextResponse(
            JSON.stringify({ error: 'An unexpected error occurred' }),
            { status: 500 }
        );
    }
}

// DELETE endpoint to remove a review
export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const reviewId = searchParams.get('id');

        if (!reviewId) {
            return new NextResponse(
                JSON.stringify({ error: 'Review ID is required' }),
                { status: 400 }
            );
        }

        // Correctly initialize Supabase client with cookies as a function
        const supabase = createRouteHandlerClient({ cookies: () => cookies() });

        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return new NextResponse(
                JSON.stringify({ error: 'Authentication required' }),
                { status: 401 }
            );
        }

        // Check if review exists and belongs to the user
        const { data: review, error: reviewError } = await supabase
            .from('reviews')
            .select('id, user_id, mcp_id')  // Also fetch mcp_id to invalidate cache
            .eq('id', reviewId)
            .single();

        if (reviewError || !review) {
            return new NextResponse(
                JSON.stringify({ error: 'Review not found' }),
                { status: 404 }
            );
        }

        // Verify the review belongs to the current user
        if (review.user_id !== session.user.id) {
            return new NextResponse(
                JSON.stringify({ error: 'Not authorized to delete this review' }),
                { status: 403 }
            );
        }

        // Delete the review
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId);

        if (error) {
            console.error('Error deleting review:', error);
            return new NextResponse(
                JSON.stringify({ error: 'Failed to delete review' }),
                { status: 500 }
            );
        }

        // Invalidate the reviews cache for this MCP
        if (review.mcp_id) {
            cache.delete(createReviewsCacheKey(review.mcp_id));
        }

        return new NextResponse(
            JSON.stringify({
                success: true,
                message: 'Review deleted successfully'
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Unexpected error:', error);
        return new NextResponse(
            JSON.stringify({ error: 'An unexpected error occurred' }),
            { status: 500 }
        );
    }
}