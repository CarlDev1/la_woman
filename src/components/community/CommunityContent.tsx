import { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { usePosts } from '@/hooks/usePosts';
import PostCard from '@/components/community/PostCard';
import { Post } from '@/types/community';
import CreatePostModal from '@/components/community/CreatePostModal';

export default function CommunityContent() {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  
  const {
    posts,
    loading,
    searchQuery,
    setSearchQuery,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    updateCommentCount,
  } = usePosts();

  const handleCreatePost = async ({ content, imageFile }: { content: string; imageFile?: File }) => {
    try {
      await createPost({ content, imageFile });
      toast({
        title: 'Publication créée',
        description: 'Votre publication a été ajoutée avec succès',
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la création de la publication',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePost = async ({ id, content, imageFile, currentImageUrl }: { 
    id: string; 
    content: string; 
    imageFile?: File; 
    currentImageUrl: string | null 
  }) => {
    try {
      await updatePost({ 
        id, 
        content, 
        imageFile, 
        currentImageUrl 
      });
      toast({
        title: 'Publication mise à jour',
        description: 'Votre publication a été mise à jour avec succès',
      });
      setEditingPost(null);
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour de la publication',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette publication ?')) {
      try {
        await deletePost(id);
        toast({
          title: 'Publication supprimée',
          description: 'Votre publication a été supprimée avec succès',
        });
      } catch (error) {
        console.error('Error deleting post:', error);
        toast({
          title: 'Erreur',
          description: 'Une erreur est survenue lors de la suppression de la publication',
          variant: 'destructive',
        });
      }
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setIsCreateModalOpen(true);
  };

  const filteredPosts = posts.filter(post => 
    (post.content?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (post.author_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Communauté</h1>
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher des publications..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={() => {
            setEditingPost(null);
            setIsCreateModalOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle publication
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucune publication trouvée</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onToggleLike={toggleLike}
              onDelete={handleDeletePost}
              onCommentAdded={() => updateCommentCount(post.id, true)}
              onCommentDeleted={() => updateCommentCount(post.id, false)}
              onEdit={handleEditPost}
            />
          ))
        )}
      </div>

      <CreatePostModal
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setEditingPost(null);
          } else {
            setIsCreateModalOpen(true);
          }
        }}
        onSubmit={editingPost 
          ? (data) => handleUpdatePost({ 
              id: editingPost.id, 
              content: data.content, 
              imageFile: data.imageFile,
              currentImageUrl: posts.find(p => p.id === editingPost.id)?.image_url || null,
            })
          : handleCreatePost
        }
        postToEdit={editingPost}
      />
    </div>
  );
}
