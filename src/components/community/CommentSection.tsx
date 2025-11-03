import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Comment } from '@/types/community';
import { formatRelativeDate } from '@/lib/date-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Trash2 } from 'lucide-react';
import { addComment, deleteComment } from '@/lib/community-api';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface CommentSectionProps {
  postId: string;
  onCommentAdded: () => void;
  onCommentDeleted: () => void;
}

export default function CommentSection({ postId, onCommentAdded, onCommentDeleted }: CommentSectionProps) {
  const { user, profile } = useAuth() as { user: { id: string; role?: string } | null; profile: { full_name: string; role?: string; [key: string]: any } | null };
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch comments for this post
  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('comments_with_author')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Erreur lors du chargement des commentaires');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchComments();
  }, [postId]);

  // Handle new comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !newComment.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const newCommentObj: Comment = {
        id: tempId,
        post_id: postId,
        user_id: user.id,
        content: newComment,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author_name: profile?.full_name || 'Utilisateur',
        author_photo: (profile as any)?.avatar_url || null,
        author_role: (profile?.role === 'admin' ? 'admin' : 'user') as 'user' | 'admin',
      };
      
      setComments(prev => [...prev, newCommentObj]);
      setNewComment('');
      
      // Call API
      await addComment(postId, user.id, newComment);
      
      // Refresh comments
      await fetchComments();
      
      // Notify parent
      onCommentAdded();
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Erreur lors de l\'ajout du commentaire');
      // Remove optimistic update on error
      setComments(prev => prev.filter(c => c.id !== `temp-${Date.now()}`));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId: string, commentUserId: string) => {
    if (!user) return;
    
    try {
      // Optimistic update
      setComments(prev => prev.filter(c => c.id !== commentId));
      
      // Call API
      await deleteComment(commentId, user.id, (user.role === 'admin' ? 'admin' : 'user') as 'user' | 'admin');
      
      // Notify parent
      onCommentDeleted();
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Erreur lors de la suppression du commentaire');
      // Re-fetch comments to restore state
      fetchComments();
    }
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        Chargement des commentaires...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comment list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Soyez le premier à commenter !
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start space-x-3 group">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarImage src={comment.author_photo || ''} alt={comment.author_name} />
                <AvatarFallback>
                  {comment.author_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{comment.author_name}</span>
                      {comment.author_role === 'admin' && (
                        <Badge variant="secondary" className="bg-pink-100 text-pink-700 text-xs">
                          Admin
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeDate(comment.created_at)}
                      </span>
                    </div>
                    
                    {(user?.id === comment.user_id || user?.role === 'admin') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteComment(comment.id, comment.user_id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                  
                  <p className="mt-1 text-sm">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add comment form */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="flex items-start space-x-2 pt-2">
          <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
            <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
            <AvatarFallback>
              {profile?.full_name
                ?.split(' ')
                .map((n: string) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 relative">
            <Input
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isSubmitting}
              className="pr-12"
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              disabled={!newComment.trim() || isSubmitting}
            >
              <Send className={cn(
                'h-4 w-4',
                newComment.trim() ? 'text-primary' : 'text-muted-foreground'
              )} />
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          Connectez-vous pour commenter
        </div>
      )}
      
      {error && (
        <div className="text-sm text-red-500 text-center py-2">
          {error}
        </div>
      )}
    </div>
  );
}
