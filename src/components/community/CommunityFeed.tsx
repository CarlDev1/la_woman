import CreatePostModal from "@/components/community/CreatePostModal";
import PostCard from "@/components/community/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CommunityFeedProps {
  /** Titre à afficher dans le header */
  title?: string;
  /** Afficher le bouton flottant pour mobile */
  showFloatingButton?: boolean;
  /** Layout de la grille des posts */
  gridLayout?: "grid" | "list";
  /** Classe CSS personnalisée pour le conteneur */
  className?: string;
}

export default function CommunityFeed({
  title = "Communauté LA WOMAN",
  showFloatingButton = true,
  gridLayout = "list",
  className = "",
}: CommunityFeedProps) {
  const { profile, user } = useAuth();
  const isCurrentUserAdmin = profile?.role === "admin";
  const currentUserId = user?.id || profile?.id || "";

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const {
    posts,
    loading,
    currentUser,
    searchQuery,
    setSearchQuery,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    incrementCommentCount,
    decrementCommentCount,
  } = usePosts();

  const handleCreatePost = async (content: string, imageFile?: File) => {
    try {
      await createPost(content, imageFile);
      setIsCreateModalOpen(false);
      toast.success("✅ Post publié avec succès !");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Erreur lors de la publication");
    }
  };

  const handleUpdatePost = async (
    postId: string,
    content: string,
    imageFile?: File
  ) => {
    try {
      await updatePost(postId, content, imageFile);
      toast.success("✅ Post modifié avec succès !");
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      toast.success("Post supprimé");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      await toggleLike(postId);
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Erreur lors du like");
    }
  };

  // Utiliser currentUser.id du hook ou fallback sur user/profile
  const effectiveCurrentUserId = currentUser?.id || currentUserId;

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{title}</h1>

            {/* Desktop button */}
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="hidden md:flex"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un post
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher dans les posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="container px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : searchQuery && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucun résultat</h2>
            <p className="text-muted-foreground">
              Aucun post ne correspond à votre recherche "{searchQuery}"
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery("")}
              className="mt-4"
            >
              Effacer la recherche
            </Button>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-6xl mb-4">🌟</span>
            <h2 className="text-xl font-semibold mb-2">
              Soyez la première à partager !
            </h2>
            <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
              Créer mon premier post
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={effectiveCurrentUserId}
                isCurrentUserAdmin={isCurrentUserAdmin}
                onToggleLike={handleToggleLike}
                onUpdate={handleUpdatePost}
                onDelete={handleDeletePost}
                onCommentAdded={incrementCommentCount}
                onCommentDeleted={decrementCommentCount}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (Mobile) */}
      {showFloatingButton && (
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="md:hidden fixed bottom-20 right-4 rounded-full w-14 h-14 shadow-lg z-50"
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreatePost}
      />
    </div>
  );
}
