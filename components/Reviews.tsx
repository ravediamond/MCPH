'use client';

import React, { useState, useEffect } from 'react';
import { Review, ReviewSubmission, ReviewStats } from 'types/mcp';
import StarRating from './ui/StarRating';
import { useSupabase } from 'app/supabase-provider';
import { toast } from 'react-hot-toast';
import { FaCalendarAlt, FaEdit, FaTrash } from 'react-icons/fa';

interface ReviewsProps {
    mcpId: string;
}

const Reviews: React.FC<ReviewsProps> = ({ mcpId }) => {
    const { supabase, session } = useSupabase();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats>({ avg_rating: 0, review_count: 0 });
    const [userReview, setUserReview] = useState<Review | null>(null);
    const [newReviewRating, setNewReviewRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editing, setEditing] = useState(false);

    // Fetch reviews for this MCP
    const fetchReviews = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/mcps/reviews?mcp_id=${mcpId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch reviews');
            }

            const data = await response.json();
            setReviews(data.reviews || []);
            setStats(data.stats || { avg_rating: 0, review_count: 0 });

            // If user is logged in, check if they've already left a review
            if (session?.user) {
                const userReview = data.reviews.find(
                    (review: Review) => review.user_id === session.user.id
                );

                if (userReview) {
                    setUserReview(userReview);
                    setNewReviewRating(userReview.rating);
                    setComment(userReview.comment || '');
                }
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    // Submit a new review or update an existing one
    const handleSubmitReview = async () => {
        if (!session) {
            toast.error('You must be logged in to leave a review');
            return;
        }

        if (newReviewRating < 1) {
            toast.error('Please select a rating');
            return;
        }

        setSubmitting(true);

        try {
            const reviewData: ReviewSubmission = {
                mcp_id: mcpId,
                rating: newReviewRating,
                comment: comment.trim() || undefined,
            };

            const response = await fetch('/api/mcps/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reviewData),
            });

            if (!response.ok) {
                throw new Error('Failed to submit review');
            }

            const result = await response.json();
            toast.success(result.message);
            setEditing(false);

            // Refresh reviews after submitting
            await fetchReviews();
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error('Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete a review
    const handleDeleteReview = async () => {
        if (!userReview?.id || !session) return;

        if (confirm('Are you sure you want to delete your review?')) {
            try {
                const response = await fetch(`/api/mcps/reviews?id=${userReview.id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Failed to delete review');
                }

                toast.success('Your review has been deleted');
                setUserReview(null);
                setNewReviewRating(0);
                setComment('');

                // Refresh reviews after deleting
                await fetchReviews();
            } catch (error) {
                console.error('Error deleting review:', error);
                toast.error('Failed to delete review');
            }
        }
    };

    // Format date for display
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Load reviews on component mount
    useEffect(() => {
        if (mcpId) {
            fetchReviews();
        }
    }, [mcpId, session]);

    return (
        <div className="w-full my-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Reviews</h2>

            {/* Review Summary */}
            <div className="bg-white border border-gray-200 p-4 rounded-lg mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="flex items-center mb-2 md:mb-0">
                        <StarRating initialRating={stats.avg_rating} readOnly size={24} />
                        <span className="ml-2 text-lg font-medium text-gray-800">
                            {stats.avg_rating ? stats.avg_rating.toFixed(1) : '0.0'}
                        </span>
                        <span className="ml-2 text-gray-500 text-sm">
                            ({stats.review_count} {stats.review_count === 1 ? 'review' : 'reviews'})
                        </span>
                    </div>

                    {stats.rating_distribution && stats.review_count > 0 && (
                        <div className="w-full md:w-1/2">
                            {[5, 4, 3, 2, 1].map(rating => {
                                const count = stats.rating_distribution?.[rating as keyof typeof stats.rating_distribution] || 0;
                                const percentage = stats.review_count > 0 ? (count / stats.review_count) * 100 : 0;
                                return (
                                    <div key={rating} className="flex items-center my-1">
                                        <span className="w-8 text-sm text-gray-600">{rating} ★</span>
                                        <div className="w-full bg-gray-100 rounded-full h-2 mx-2">
                                            <div
                                                className="bg-yellow-400 h-2 rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                        <span className="w-12 text-xs text-gray-500">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Review Section */}
            {session ? (
                userReview && !editing ? (
                    <div className="bg-primary-50 p-4 rounded-lg mb-6 border border-primary-100">
                        <div className="flex justify-between items-start">
                            <h3 className="font-medium text-gray-800 mb-2">Your Review</h3>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setEditing(true)}
                                    className="text-gray-500 hover:text-primary-600 transition-colors p-1"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    onClick={handleDeleteReview}
                                    className="text-gray-500 hover:text-red-500 transition-colors p-1"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>

                        <div className="mb-2">
                            <StarRating initialRating={userReview.rating} readOnly />
                        </div>

                        {userReview.comment && (
                            <p className="text-sm text-gray-700 mb-2">{userReview.comment}</p>
                        )}

                        <div className="text-xs text-gray-500 flex items-center">
                            <FaCalendarAlt className="mr-1" />
                            {formatDate(userReview.created_at)}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-4 rounded-lg mb-6 border border-gray-200 shadow-sm">
                        <h3 className="font-medium text-gray-800 mb-4">
                            {editing ? 'Edit Your Review' : 'Write a Review'}
                        </h3>

                        <div className="mb-4">
                            <label htmlFor="rating" className="block mb-2 text-sm text-gray-700">Rating</label>
                            <StarRating
                                initialRating={newReviewRating}
                                onChange={(rating) => setNewReviewRating(rating)}
                                size={28}
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="comment" className="block mb-2 text-sm text-gray-700">Comment (optional)</label>
                            <textarea
                                id="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-md shadow-sm focus:ring-1 focus:ring-primary-300 focus:border-primary-400"
                                rows={4}
                                placeholder="Share your experience with this MCP..."
                            />
                        </div>

                        <div className="flex justify-between">
                            {editing && (
                                <button
                                    onClick={() => {
                                        setEditing(false);
                                        setNewReviewRating(userReview?.rating || 0);
                                        setComment(userReview?.comment || '');
                                    }}
                                    className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={handleSubmitReview}
                                disabled={submitting || newReviewRating < 1}
                                className={`py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors ml-auto ${submitting || newReviewRating < 1 ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                {submitting ? 'Submitting...' : editing ? 'Update Review' : 'Submit Review'}
                            </button>
                        </div>
                    </div>
                )
            ) : (
                <div className="bg-white p-4 rounded-lg mb-6 text-center border border-gray-200 shadow-sm">
                    <p className="text-gray-600">Please sign in to leave a review</p>
                </div>
            )}

            {/* Reviews List */}
            {loading ? (
                <div className="text-center p-4">Loading reviews...</div>
            ) : reviews.length > 0 ? (
                <div className="divide-y divide-gray-200">
                    {reviews.map((review) => (
                        <div key={review.id} className="py-4">
                            <div className="flex justify-between">
                                <div>
                                    <div className="flex items-center">
                                        <StarRating initialRating={review.rating} readOnly size={16} />
                                        <span className="ml-2 font-medium text-gray-800">
                                            {review.user?.username || 'Anonymous User'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {formatDate(review.created_at)}
                                        {review.updated_at && review.updated_at !== review.created_at && (
                                            <span> (edited)</span>
                                        )}
                                    </div>
                                </div>

                                {/* Show edit/delete buttons if this review belongs to the current user */}
                                {session?.user && review.user_id === session.user.id && userReview && !editing && (
                                    <div className="flex space-x-2 invisible">
                                        {/* Hidden here as we already show these buttons in the "Your Review" section */}
                                    </div>
                                )}
                            </div>

                            {review.comment && (
                                <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 border-t border-gray-200">
                    <p className="text-gray-500">No reviews yet. Be the first to review this MCP!</p>
                </div>
            )}
        </div>
    );
};

export default Reviews;