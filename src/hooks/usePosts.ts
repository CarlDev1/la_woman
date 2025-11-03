import { useState } from "react";

export interface PostAuthor {
  id: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
}

export interface Post {
  id: string;
  author: PostAuthor;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt?: Date;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  author: PostAuthor;
  content: string;
  createdAt: Date;
}

// Mock current user - TODO: Remplacer par le vrai user connecté
const CURRENT_USER: PostAuthor = {
  id: "user1",
  name: "Vous",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=You",
  isAdmin: false
};

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([
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
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
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
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
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
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      likesCount: 8,
      commentsCount: 12,
      isLiked: false
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");

  const createPost = async (content: string, imageFile?: File) => {
    // TODO: Upload image et créer post en DB
    const newPost: Post = {
      id: Date.now().toString(),
      author: CURRENT_USER,
      content,
      imageUrl: imageFile ? URL.createObjectURL(imageFile) : null, // Mock - sera remplacé par l'URL Supabase
      createdAt: new Date(),
      likesCount: 0,
      commentsCount: 0,
      isLiked: false
    };
    
    setPosts([newPost, ...posts]);
    return newPost;
  };

  const updatePost = async (postId: string, content: string, imageFile?: File) => {
    // TODO: Update post en DB
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            content, 
            imageUrl: imageFile ? URL.createObjectURL(imageFile) : post.imageUrl,
            updatedAt: new Date()
          }
        : post
    ));
  };

  const deletePost = async (postId: string) => {
    // TODO: Delete post en DB
    setPosts(posts.filter(post => post.id !== postId));
  };

  const toggleLike = async (postId: string) => {
    // Optimistic update
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked, 
            likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1 
          }
        : post
    ));

    try {
      // TODO: Toggle like en DB
      console.log("Toggle like for post:", postId);
    } catch (error) {
      // Rollback en cas d'erreur
      setPosts(posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: !post.isLiked, 
              likesCount: post.isLiked ? post.likesCount + 1 : post.likesCount - 1 
            }
          : post
      ));
      throw error;
    }
  };

  const incrementCommentCount = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, commentsCount: post.commentsCount + 1 }
        : post
    ));
  };

  const decrementCommentCount = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, commentsCount: Math.max(0, post.commentsCount - 1) }
        : post
    ));
  };

  // Filtrer les posts par recherche
  const filteredPosts = searchQuery.trim()
    ? posts.filter(post => 
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  return {
    posts: filteredPosts,
    currentUser: CURRENT_USER,
    searchQuery,
    setSearchQuery,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    incrementCommentCount,
    decrementCommentCount
  };
};
