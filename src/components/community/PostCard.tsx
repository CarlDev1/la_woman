import { useState, lazy, Suspense } from 'react';
import { formatRelativeDate } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, MoreHorizontal, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { Post } from '@/types/community';
import { cn } from '@/lib/utils';

// Lazy load CommentSection to avoid circular dependencies
const CommentSection = lazy(() => import('./CommentSection'));

interface PostCardProps {
  post: Post;
  onToggleLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onCommentAdded: () => void;
  onCommentDeleted: () => void;
  onEdit: (post: Post) => void;
}

export default function PostCard({
  post,
  onToggleLike,
  onDelete,
  onCommentAdded,
  onCommentDeleted,
  onEdit,
}: PostCardProps) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = user?.id === post.user_id;
  const hasImage = !!post.image_url;

  const handleLike = () => {
    onToggleLike(post.id);
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette publication ?')) {
      try {
        setIsDeleting(true);
        await onDelete(post.id);
      } catch (error) {
        console.error('Error deleting post:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEdit = () => {
    onEdit(post);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author_photo || ''} alt={post.author_name} />
              <AvatarFallback>
                {post.author_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{post.author_name}</span>
                {post.author_role === 'admin' && (
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                    Admin
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatRelativeDate(post.created_at)}
              </span>
            </div>
          </div>
          
          {(isAuthor || user?.role === 'admin') && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAuthor && (
                  <DropdownMenuItem onClick={handleEdit}>
                    Modifier
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={handleDelete} 
                  className="text-red-600 focus:text-red-600"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        {post.content && (
          <p className="mb-4 whitespace-pre-line">{post.content}</p>
        )}
        
        {hasImage && (
          <div 
            className="relative rounded-md overflow-hidden bg-muted cursor-pointer"
            onClick={() => setShowImageModal(true)}
          >
            <img
              src={post.image_url!}
              alt="Post content"
              className="w-full h-auto object-cover"
              style={{ aspectRatio: '16/9' }}
              loading="lazy"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'flex items-center space-x-1',
              post.is_liked_by_current_user ? 'text-red-500' : 'text-muted-foreground'
            )}
            onClick={handleLike}
          >
            <Heart
              className={cn(
                'h-5 w-5',
                post.is_liked_by_current_user ? 'fill-current' : ''
              )}
            />
            <span>{post.like_count}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-1 text-muted-foreground"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-5 w-5" />
            <span>{post.comment_count}</span>
          </Button>
        </div>
      </CardFooter>

      {/* Comments Section */}
      <Suspense fallback={<div className="mt-3 p-4 text-center text-gray-500">Chargement des commentaires...</div>}>
        {showComments && (
          <div className="mt-3 border-t border-gray-200 pt-3">
            <CommentSection 
              postId={post.id} 
              onCommentAdded={onCommentAdded}
              onCommentDeleted={onCommentDeleted}
            />
          </div>
        )}
      </Suspense>

      {/* Image Modal */}
      {showImageModal && hasImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
              onClick={(e) => {
                e.stopPropagation();
                setShowImageModal(false);
              }}
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="max-w-full max-h-[80vh] flex items-center justify-center">
              <img
                src={post.image_url}
                alt="Post content full size"
                className="max-w-full max-h-[80vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
