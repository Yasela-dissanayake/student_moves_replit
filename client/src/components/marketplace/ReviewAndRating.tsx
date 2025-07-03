import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Star, ThumbsUp, ThumbsDown, Flag, MessageSquare, Shield, User, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Types
interface Review {
  id: number;
  reviewerId: number;
  reviewerName: string;
  reviewerAvatar?: string;
  reviewerVerified: boolean;
  targetId: number;
  targetType: 'item' | 'user';
  rating: number;
  title?: string;
  content: string;
  verifiedPurchase: boolean;
  helpful: number;
  unhelpful: number;
  createdAt: string;
  updatedAt?: string;
  images?: string[];
  reactions?: {
    helpful: boolean;
    unhelpful: boolean;
    reported: boolean;
  };
}

interface ReviewFormData {
  title?: string;
  content: string;
  rating: number;
  images?: File[];
}

interface ReviewListProps {
  targetId: number;
  targetType: 'item' | 'user';
  averageRating?: number;
  totalReviews?: number;
}

export function ReviewStars({ 
  rating, 
  size = 'default', 
  interactive = false, 
  onChange
}: { 
  rating: number; 
  size?: 'small' | 'default' | 'large'; 
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const starSizes = {
    small: 'h-3 w-3',
    default: 'h-5 w-5',
    large: 'h-6 w-6',
  };
  
  const containerSizes = {
    small: 'gap-0.5',
    default: 'gap-1',
    large: 'gap-1.5',
  };
  
  const renderStar = (position: number) => {
    const filled = 
      interactive
        ? position <= (hoverRating || rating)
        : position <= rating;
        
    return (
      <Star
        key={position}
        className={`${starSizes[size]} ${
          filled
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-gray-300'
        } ${interactive ? 'cursor-pointer' : ''}`}
        onClick={() => {
          if (interactive && onChange) {
            onChange(position);
          }
        }}
        onMouseEnter={() => {
          if (interactive) {
            setHoverRating(position);
          }
        }}
        onMouseLeave={() => {
          if (interactive) {
            setHoverRating(0);
          }
        }}
      />
    );
  };
  
  return (
    <div className={`flex items-center ${containerSizes[size]}`}>
      {[1, 2, 3, 4, 5].map(renderStar)}
    </div>
  );
}

export function ReviewForm({ 
  targetId, 
  targetType,
  onSubmit,
  onCancel
}: { 
  targetId: number; 
  targetType: 'item' | 'user';
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<ReviewFormData>({
    title: '',
    content: '',
    rating: 0,
    images: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  
  const queryClient = useQueryClient();
  
  const handleRatingChange = (rating: number) => {
    setFormData({ ...formData, rating });
  };
  
  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Limit to 5 images
      const selectedFiles = Array.from(e.target.files).slice(0, 5);
      
      setFormData({
        ...formData,
        images: [...(formData.images || []), ...selectedFiles],
      });
      
      // Create preview URLs
      const newPreviewUrls = Array.from(selectedFiles).map(file => 
        URL.createObjectURL(file)
      );
      
      setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
    }
  };
  
  const removeImage = (index: number) => {
    const newImages = [...(formData.images || [])];
    newImages.splice(index, 1);
    
    const newPreviewUrls = [...imagePreviewUrls];
    URL.revokeObjectURL(newPreviewUrls[index]);
    newPreviewUrls.splice(index, 1);
    
    setFormData({ ...formData, images: newImages });
    setImagePreviewUrls(newPreviewUrls);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a star rating before submitting',
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.content.trim()) {
      toast({
        title: 'Review content required',
        description: 'Please write a review before submitting',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First upload the review content
      const reviewData = {
        targetId,
        targetType,
        rating: formData.rating,
        title: formData.title,
        content: formData.content,
      };
      
      const response = await apiRequest({
        url: '/api/marketplace/reviews',
        method: 'POST',
        data: reviewData,
      });
      
      // If we have images, upload them in a second request
      if (formData.images && formData.images.length > 0 && response.id) {
        const formDataWithImages = new FormData();
        formDataWithImages.append('reviewId', response.id.toString());
        formData.images.forEach(image => {
          formDataWithImages.append('images', image);
        });
        
        await fetch('/api/marketplace/reviews/images', {
          method: 'POST',
          body: formDataWithImages,
        });
      }
      
      // Clean up preview URLs
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
      
      // Invalidate the reviews cache
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/reviews/${targetType}/${targetId}`] });
      
      toast({
        title: 'Review submitted',
        description: 'Your review has been submitted successfully',
      });
      
      onSubmit();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Submission failed',
        description: 'There was an error submitting your review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Your Rating</label>
        <ReviewStars 
          rating={formData.rating} 
          size="large" 
          interactive={true} 
          onChange={handleRatingChange} 
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">Review Title (Optional)</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title || ''}
          onChange={handleTextChange}
          placeholder="Summarize your experience"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-medium">Review</label>
        <Textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleTextChange}
          placeholder="What did you like or dislike? How was the quality?"
          rows={5}
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Add Photos (Optional)</label>
        <div className="flex flex-wrap gap-2">
          {imagePreviewUrls.map((url, index) => (
            <div key={index} className="relative w-16 h-16">
              <img 
                src={url} 
                alt={`Preview ${index + 1}`} 
                className="w-full h-full object-cover rounded-md"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          ))}
          
          {imagePreviewUrls.length < 5 && (
            <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer">
              <span className="text-2xl text-gray-400">+</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                multiple
              />
            </label>
          )}
        </div>
        <p className="text-xs text-gray-500">
          You can add up to 5 photos. Each photo must be less than 5MB.
        </p>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
}

export function ReviewItem({ review, onUpdate }: { review: Review; onUpdate: () => void }) {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReaction, setIsSubmittingReaction] = useState(false);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };
  
  const handleReaction = async (type: 'helpful' | 'unhelpful') => {
    if (isSubmittingReaction) return;
    
    setIsSubmittingReaction(true);
    
    try {
      await apiRequest({
        url: `/api/marketplace/reviews/${review.id}/reaction`,
        method: 'POST',
        data: {
          type,
          value: !review.reactions?.[type],
        },
      });
      
      onUpdate();
    } catch (error) {
      console.error(`Error submitting ${type} reaction:`, error);
      toast({
        title: 'Reaction failed',
        description: 'There was an error submitting your reaction.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReaction(false);
    }
  };
  
  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast({
        title: 'Report reason required',
        description: 'Please provide a reason for reporting this review.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await apiRequest({
        url: `/api/marketplace/reviews/${review.id}/report`,
        method: 'POST',
        data: {
          reason: reportReason,
        },
      });
      
      setIsReportDialogOpen(false);
      setReportReason('');
      
      toast({
        title: 'Report submitted',
        description: 'Thank you for your report. We will review it shortly.',
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error reporting review:', error);
      toast({
        title: 'Report failed',
        description: 'There was an error submitting your report.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={review.reviewerAvatar} alt={review.reviewerName} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{review.reviewerName}</span>
                {review.reviewerVerified && (
                  <Badge variant="outline" className="text-xs gap-1 px-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified</span>
                  </Badge>
                )}
              </div>
              
              <div className="text-sm text-gray-500">{formatDate(review.createdAt)}</div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            <ReviewStars rating={review.rating} />
            
            {review.verifiedPurchase && (
              <Badge variant="secondary" className="text-xs">
                Verified Purchase
              </Badge>
            )}
          </div>
        </div>
        
        {review.title && (
          <CardTitle className="text-base mt-2">{review.title}</CardTitle>
        )}
      </CardHeader>
      
      <CardContent className="pb-0">
        <p className="text-sm whitespace-pre-line">{review.content}</p>
        
        {review.images && review.images.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {review.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Review image ${index + 1}`}
                className="w-16 h-16 object-cover rounded-md"
              />
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-4 flex justify-between">
        <div className="flex items-center space-x-4 text-sm">
          <button
            className={`flex items-center space-x-1 ${
              review.reactions?.helpful ? 'text-green-600' : 'text-gray-500'
            }`}
            onClick={() => handleReaction('helpful')}
            disabled={isSubmittingReaction}
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{review.helpful}</span>
          </button>
          
          <button
            className={`flex items-center space-x-1 ${
              review.reactions?.unhelpful ? 'text-red-600' : 'text-gray-500'
            }`}
            onClick={() => handleReaction('unhelpful')}
            disabled={isSubmittingReaction}
          >
            <ThumbsDown className="h-4 w-4" />
            <span>{review.unhelpful}</span>
          </button>
        </div>
        
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogTrigger asChild>
            <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1">
              <Flag className="h-4 w-4" />
              <span>Report</span>
            </button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Review</DialogTitle>
              <DialogDescription>
                Please explain why you are reporting this review.
              </DialogDescription>
            </DialogHeader>
            
            <Textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Explain why this review is inappropriate, misleading, or violates guidelines..."
              rows={4}
            />
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setIsReportDialogOpen(false);
                  setReportReason('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleReport}>
                Submit Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

export function ReviewList({ targetId, targetType, averageRating, totalReviews }: ReviewListProps) {
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [sortOrder, setSortOrder] = useState<'recent' | 'helpful' | 'rating_high' | 'rating_low'>('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: [`/api/marketplace/reviews/${targetType}/${targetId}`, sortOrder, filterRating],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('sort', sortOrder);
      if (filterRating !== null) {
        params.append('rating', filterRating.toString());
      }
      
      const response = await fetch(`/api/marketplace/reviews/${targetType}/${targetId}?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      return response.json();
    },
  });
  
  const handleReviewAdded = () => {
    setIsAddingReview(false);
    refetch();
  };
  
  const handleReviewUpdated = () => {
    refetch();
  };
  
  const calculatedAverageRating = data?.averageRating || averageRating || 0;
  const calculatedTotalReviews = data?.totalReviews || totalReviews || 0;
  const reviews = data?.reviews || [];
  
  // For review distribution
  const ratingDistribution = data?.ratingDistribution || {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h2 className="text-2xl font-bold">Reviews</h2>
          <div className="flex items-center mt-1">
            <ReviewStars rating={calculatedAverageRating} />
            <span className="ml-2 text-sm">
              {calculatedAverageRating.toFixed(1)} out of 5
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Based on {calculatedTotalReviews} {calculatedTotalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>
        
        {!isAddingReview && (
          <Button onClick={() => setIsAddingReview(true)}>
            Write a Review
          </Button>
        )}
      </div>
      
      {isAddingReview && (
        <Card>
          <CardHeader>
            <CardTitle>Write Your Review</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewForm
              targetId={targetId}
              targetType={targetType}
              onSubmit={handleReviewAdded}
              onCancel={() => setIsAddingReview(false)}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Rating distribution */}
      {calculatedTotalReviews > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating] || 0;
                const percentage = calculatedTotalReviews > 0
                  ? (count / calculatedTotalReviews) * 100
                  : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <button
                      onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                      className={`flex items-center w-16 text-sm ${
                        filterRating === rating ? 'font-bold' : ''
                      }`}
                    >
                      {rating} <Star className="h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />
                    </button>
                    <div className="h-2 flex-1 bg-gray-100 rounded-full">
                      <div
                        className="h-2 bg-yellow-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-14">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Sort and filter controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Sort by:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {sortOrder === 'recent' && 'Most Recent'}
                {sortOrder === 'helpful' && 'Most Helpful'}
                {sortOrder === 'rating_high' && 'Highest Rating'}
                {sortOrder === 'rating_low' && 'Lowest Rating'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortOrder('recent')}>
                Most Recent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder('helpful')}>
                Most Helpful
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder('rating_high')}>
                Highest Rating
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder('rating_low')}>
                Lowest Rating
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {filterRating !== null && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterRating(null)}
          >
            Clear Filter ({filterRating} Star)
          </Button>
        )}
      </div>
      
      {/* Reviews list */}
      <div className="space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
            </Card>
          ))
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterRating !== null 
                ? `No ${filterRating}-star reviews found` 
                : 'Be the first to review this item'}
            </p>
            
            {!isAddingReview && filterRating === null && (
              <Button
                onClick={() => setIsAddingReview(true)}
                className="mt-4"
              >
                Write a Review
              </Button>
            )}
          </div>
        ) : (
          reviews.map((review: Review) => (
            <ReviewItem
              key={review.id}
              review={review}
              onUpdate={handleReviewUpdated}
            />
          ))
        )}
      </div>
    </div>
  );
}