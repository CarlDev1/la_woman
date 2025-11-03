import { supabase } from './supabase';

/**
 * Upload an image to Supabase Storage
 * @param file - The image file to upload
 * @param userId - The ID of the user uploading the image
 * @returns The public URL of the uploaded image
 */
export const uploadPostImage = async (file: File, userId: string): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    // Upload the file to the 'post-images' bucket
    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw new Error('Erreur lors du téléchargement de l\'image');
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadPostImage:', error);
    throw error;
  }
};

/**
 * Delete an image from Supabase Storage
 * @param imageUrl - The URL of the image to delete
 */
export const deletePostImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract the file path from the URL
    const path = imageUrl.split('post-images/')[1];
    
    if (path) {
      const { error } = await supabase.storage
        .from('post-images')
        .remove([path]);

      if (error) {
        console.error('Error deleting image:', error);
        throw new Error('Erreur lors de la suppression de l\'image');
      }
    }
  } catch (error) {
    console.error('Error in deletePostImage:', error);
    throw error;
  }
};

/**
 * Toggle like on a post
 * @param postId - The ID of the post to like/unlike
 * @param userId - The ID of the user performing the action
 */
export const togglePostLike = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('toggle_post_like', {
      post_id_param: postId,
      user_id_param: userId
    });

    if (error) {
      console.error('Error toggling like:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in togglePostLike:', error);
    throw error;
  }
};

/**
 * Add a comment to a post
 * @param postId - The ID of the post to comment on
 * @param userId - The ID of the user adding the comment
 * @param content - The comment content
 */
export const addComment = async (postId: string, userId: string, content: string) => {
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Delete a comment
 * @param commentId - The ID of the comment to delete
 * @param userId - The ID of the user requesting deletion
 * @param userRole - The role of the user (for permission check)
 */
export const deleteComment = async (commentId: string, userId: string, userRole: 'user' | 'admin') => {
  try {
    // For admins, we don't need to check the user_id
    const query = supabase
      .from('post_comments')
      .delete()
      .eq('id', commentId);

    // Regular users can only delete their own comments
    if (userRole !== 'admin') {
      query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};
