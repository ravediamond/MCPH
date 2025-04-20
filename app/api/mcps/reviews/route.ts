import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Review, ReviewSubmission } from 'types/mcp';
import { cacheFetch, invalidateCache, CACHE_REGIONS } from 'utils/cacheUtils';

// Cache TTL for reviews (5 minutes)
const REVIEWS_CACHE_TTL = 5 * 60;

// Define reviews region and user region
const REVIEWS_REGION = 'reviews';
const USER_REGION = 'user';

// Create a cache key for reviews of a specific MCP
function createReviewsCacheKey(mcpId: string): string {
    return mcpId;
}

// Creates a cache key for user profile data
function createUserProfileCacheKey(userId: string): string {
    return userId;
}

// GET endpoint to retrieve reviews for a specific MCP
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const mcpId = searchParams.get('mcp_id');

        if (!mcpId) {
            return new NextResponse(
                JSON.stringify({ error: 'MCP ID is required' }),
                { status: 400 }
            );
        }

        // Use the new cacheFetch with proper region
        return cacheFetch(
            REVIEWS_REGION,
            createReviewsCacheKey(mcpId),
            async () => {
                // Correctly initialize Supabase client with cookies as a function
                const supabase = createRouteHandlerClient({ cookies: () => cookies() });

                // Execute all these queries in parallel to reduce wait time
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

                const { data: reviews, error: reviewsError } = reviewsResponse;
                const { data: mcpData, error: mcpError } = mcpStatsResponse;

                if (reviewsError) {
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

                    // We'll fetch all profiles from the database directly
                    // since our new caching system will handle caching efficiently
                    const { data: profiles, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, username, email')
                        .in('id', userIdsArray);

                    if (!profilesError && profiles) {
                        // Add fetched profiles to our mapping
                        profiles.forEach(profile => {
                            userProfiles[profile.id] = profile;
                        });
                    }
                }

                // Add user info to reviews
                const reviewsWithUserInfo = reviews?.map(review => ({
                    ...review,
                    user: userProfiles[review.user_id] || null
                })) || [];

                // Calculate rating distribution
                const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                reviews?.forEach(review => {
                    if (review.rating >= 1 && review.rating <= 5) {
                        distribution[review.rating as 1 | 2 | 3 | 4 | 5]++;
                    }
                });

                return {
                    reviews: reviewsWithUserInfo,
                    stats: {
                        avg_rating: mcpData?.avg_rating || 0,
                        review_count: mcpData?.review_count || 0,
                        rating_distribution: distribution
                    }
                };
            },
            REVIEWS_CACHE_TTL
        ).then(data => NextResponse.json(data));
    } catch (error) {
        console.error('Unexpected error:', error);
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

        // Invalidate the reviews cache for this MCP using the new cache system
        invalidateCache(REVIEWS_REGION, createReviewsCacheKey(body.mcp_id));

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

        // Invalidate the reviews cache for this MCP using the new cache system
        if (review.mcp_id) {
            invalidateCache(REVIEWS_REGION, createReviewsCacheKey(review.mcp_id));
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