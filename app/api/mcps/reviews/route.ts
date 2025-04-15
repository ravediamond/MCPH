import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Review, ReviewSubmission } from 'types/mcp';

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

        const supabase = createRouteHandlerClient({ cookies });

        const { data, error } = await supabase
            .from('reviews')
            .select(`
        id,
        created_at,
        updated_at,
        mcp_id,
        user_id,
        rating,
        comment,
        profiles:user_id (
          username,
          email
        )
      `)
            .eq('mcp_id', mcpId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reviews:', error);
            return new NextResponse(
                JSON.stringify({ error: 'Failed to fetch reviews' }),
                { status: 500 }
            );
        }

        // Get the rating distribution
        const { data: statsData, error: statsError } = await supabase
            .from('reviews')
            .select('rating')
            .eq('mcp_id', mcpId);

        if (statsError) {
            console.error('Error fetching review stats:', statsError);
        }

        // Calculate distribution
        const distribution = statsData ? {
            1: statsData.filter(r => r.rating === 1).length,
            2: statsData.filter(r => r.rating === 2).length,
            3: statsData.filter(r => r.rating === 3).length,
            4: statsData.filter(r => r.rating === 4).length,
            5: statsData.filter(r => r.rating === 5).length,
        } : undefined;

        // Get MCP details with avg_rating and review_count
        const { data: mcpData, error: mcpError } = await supabase
            .from('mcps')
            .select('avg_rating, review_count')
            .eq('id', mcpId)
            .single();

        if (mcpError) {
            console.error('Error fetching MCP stats:', mcpError);
        }

        return new NextResponse(
            JSON.stringify({
                reviews: data,
                stats: {
                    avg_rating: mcpData?.avg_rating || 0,
                    review_count: mcpData?.review_count || 0,
                    rating_distribution: distribution
                }
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

// POST endpoint to add a new review
export async function POST(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });

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

        // Check if the MCP exists
        const { data: mcpExists, error: mcpError } = await supabase
            .from('mcps')
            .select('id')
            .eq('id', body.mcp_id)
            .single();

        if (mcpError || !mcpExists) {
            return new NextResponse(
                JSON.stringify({ error: 'MCP not found' }),
                { status: 404 }
            );
        }

        // Check if user has already reviewed this MCP
        const { data: existingReview } = await supabase
            .from('reviews')
            .select('id')
            .eq('mcp_id', body.mcp_id)
            .eq('user_id', session.user.id)
            .single();

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

        const supabase = createRouteHandlerClient({ cookies });

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
            .select('id, user_id')
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