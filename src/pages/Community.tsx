import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/community/PostCard";
import CreatePostModal from "@/components/community/CreatePostModal";
import DashboardLayout from "@/components/DashboardLayout";

// Mock data - sera remplacé par les vraies données de la DB
const mockPosts = [
  {
    id: "1",
    author: {
      id: "user1",
      name: "Sophie Martin",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
      isAdmin: false
    },
    content: "Je viens de terminer ma première semaine de défi ! Tellement fière de moi 💪 Qui d'autre est motivée ?",
    imageUrl: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2h
    likesCount: 12,
    commentsCount: 5,
    isLiked: false
  },
  {
    id: "2",
    author: {
      id: "admin1",
      name: "Julie Coach",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Julie",
      isAdmin: true
    },
    content: "Astuce du jour : N'oubliez pas de célébrer chaque petite victoire ! 🎉 Partagez vos réussites de la semaine en commentaire ⬇️",
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // Il y a 5h
    likesCount: 28,
    commentsCount: 15,
    isLiked: true
  },
  {
    id: "3",
    author: {
      id: "user2",
      name: "Emma Dupont",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
      isAdmin: false
    },
    content: "Besoin de conseils : comment rester motivée quand on a une semaine chargée au travail ? 🤔",
    imageUrl: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Hier
    likesCount: 8,
    commentsCount: 12,
    isLiked: false
  }
];

const Community = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [posts, setPosts] = useState(mockPosts);

  const handleCreatePost = (content: string, imageFile?: File) => {
    // TODO: Implémenter la création de post avec la DB
    console.log("Créer post:", content, imageFile);
    setIsCreateModalOpen(false);
  };

  const handleToggleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1 }
        : post
    ));
  };

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(post => post.id !== postId));
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Communauté LA WOMAN</h1>
            
            {/* Desktop button */}
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="hidden md:flex"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un post
            </Button>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="container max-w-7xl mx-auto px-4 py-6">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-6xl mb-4">🌟</span>
              <h2 className="text-xl font-semibold mb-2">Soyez la première à partager !</h2>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4"
              >
                Créer mon premier post
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId="user1" // TODO: Récupérer l'ID du user connecté
                  onToggleLike={handleToggleLike}
                  onDelete={handleDeletePost}
                />
              ))}
            </div>
          )}
        </div>

        {/* Floating Action Button (Mobile) */}
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="md:hidden fixed bottom-20 right-4 rounded-full w-14 h-14 shadow-lg"
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>

        {/* Create Post Modal */}
        <CreatePostModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSubmit={handleCreatePost}
        />
      </div>
    </DashboardLayout>
  );
};

export default Community;
