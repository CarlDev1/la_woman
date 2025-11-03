import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { uploadPostImage, deletePostImage, togglePostLike } from '@/lib/community-api';
import type { Post, CreatePostData, UpdatePostData } from '@/types/community';

export const usePosts = () => {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch all posts
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('posts_with_stats')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      const postsData = data || [];
      setAllPosts(postsData);
      setPosts(postsData);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Erreur lors du chargement des publications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter posts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setPosts(allPosts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allPosts.filter(
      post => 
        (post.content?.toLowerCase().includes(query)) ||
        post.author_name.toLowerCase().includes(query)
    );
    
    setPosts(filtered);
  }, [searchQuery, allPosts]);

  // Initial fetch
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Create a new post
  const createPost = async ({ content, imageFile }: CreatePostData) => {
    try {
      if (!user) throw new Error('Utilisateur non connecté');
      if (!content?.trim() && !imageFile) {
        throw new Error('Le contenu ou une image est requis');
      }
      if (content && content.trim().length < 10 && !imageFile) {
        throw new Error('Le texte doit contenir au moins 10 caractères');
      }

      setLoading(true);
      
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadPostImage(imageFile, user.id);
      }

      const { data, error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content?.trim() || null,
          image_url: imageUrl
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Refresh posts
      await fetchPosts();
      return data;
    } catch (err) {
      console.error('Error creating post:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing post
  const updatePost = async ({ id, content, imageFile, currentImageUrl }: UpdatePostData) => {
    try {
      if (!user) throw new Error('Utilisateur non connecté');
      if (!content?.trim() && !imageFile && !currentImageUrl) {
        throw new Error('Le contenu ou une image est requis');
      }
      if (content && content.trim().length < 10 && !imageFile && !currentImageUrl) {
        throw new Error('Le texte doit contenir au moins 10 caractères');
      }

      setLoading(true);
      
      let imageUrl = currentImageUrl || null;
      
      // Upload new image if provided
      if (imageFile) {
        // Delete old image if exists
        if (currentImageUrl) {
          await deletePostImage(currentImageUrl);
        }
        imageUrl = await uploadPostImage(imageFile, user.id);
      }

      const updateData: any = {};
      if (content !== undefined) {
        updateData.content = content.trim() || null;
      }
      if (imageUrl !== undefined) {
        updateData.image_url = imageUrl;
      }

      const { data, error: updateError } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Refresh posts
      await fetchPosts();
      return data;
    } catch (err) {
      console.error('Error updating post:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a post
  const deletePost = async (postId: string) => {
    try {
      setLoading(true);
      
      // Get the post to delete its image if it has one
      const postToDelete = allPosts.find(post => post.id === postId);
      if (postToDelete?.image_url) {
        await deletePostImage(postToDelete.image_url);
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      // Update local state
      setAllPosts(prev => prev.filter(post => post.id !== postId));
      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Toggle like on a post
  const toggleLike = async (postId: string) => {
    if (!user) return;
    
    try {
      // Optimistic update
      const wasLiked = posts.find(p => p.id === postId)?.is_liked_by_current_user;
      
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                like_count: wasLiked ? post.like_count - 1 : post.like_count + 1,
                is_liked_by_current_user: !wasLiked,
              }
            : post
        )
      );

      setAllPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                like_count: wasLiked ? post.like_count - 1 : post.like_count + 1,
                is_liked_by_current_user: !wasLiked,
              }
            : post
        )
      );

      // Call the API
      await togglePostLike(postId, user.id);
    } catch (err) {
      console.error('Error toggling like:', err);
      // Revert optimistic update on error
      fetchPosts();
    }
  };

  // Update comment count
  const updateCommentCount = (postId: string, increment: boolean) => {
    const updateCount = (prevPosts: Post[]) =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              comment_count: increment
                ? post.comment_count + 1
                : Math.max(0, post.comment_count - 1),
            }
          : post
      );

    setPosts(updateCount);
    setAllPosts(updateCount);
  };

  return {
    posts,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    updateCommentCount,
    refreshPosts: fetchPosts,
  };
};
