import {
  deletePostImage,
  togglePostLike,
  uploadPostImage,
} from "@/lib/community-api";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

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

export const usePosts = () => {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Charger les posts depuis Supabase
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadPosts();

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => {
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadPosts = async () => {
    try {
      setLoading(true);

      // Charger les posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id, user_id, content, image_url, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (postsError) {
        throw postsError;
      }

      // Récupérer tous les user_ids uniques
      const userIds = [
        ...new Set(
          (postsData || []).map((p: { user_id: string }) => p.user_id)
        ),
      ];

      // Charger les profils des auteurs (avec gestion d'erreur)
      const profilesMap = new Map();
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, profile_photo_url, role")
          .in("id", userIds);

        if (profilesError) {
          // Ne pas throw, on continue avec les profils disponibles
        } else {
          (profilesData || []).forEach(
            (profile: {
              id: string;
              full_name: string;
              profile_photo_url: string | null;
              role: string;
            }) => {
              profilesMap.set(profile.id, profile);
            }
          );
        }
      }

      // Charger les likes pour l'utilisateur actuel
      let userLikes: string[] = [];
      if (user) {
        const { data: likesData } = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", user.id);

        userLikes = likesData?.map((l) => l.post_id) || [];
      }

      // Charger les compteurs de likes et commentaires
      const { data: likesCounts } = await supabase
        .from("post_likes")
        .select("post_id");

      const { data: commentsCounts } = await supabase
        .from("post_comments")
        .select("post_id");

      // Calculer les compteurs par post
      const likesMap = new Map<string, number>();
      likesCounts?.forEach((like) => {
        likesMap.set(like.post_id, (likesMap.get(like.post_id) || 0) + 1);
      });

      const commentsMap = new Map<string, number>();
      commentsCounts?.forEach((comment) => {
        commentsMap.set(
          comment.post_id,
          (commentsMap.get(comment.post_id) || 0) + 1
        );
      });

      // Transformer les données en format Post
      const transformedPosts: Post[] = (postsData || []).map(
        (post: {
          id: string;
          user_id: string;
          content: string;
          image_url: string | null;
          created_at: string;
          updated_at?: string;
        }) => {
          const authorProfile = profilesMap.get(post.user_id);

          // Si le profil n'existe pas, utiliser des valeurs par défaut

          const author: PostAuthor = {
            id: authorProfile?.id || post.user_id,
            name: authorProfile?.full_name || "Utilisateur inconnu",
            avatar:
              authorProfile?.profile_photo_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`,
            isAdmin: authorProfile?.role === "admin",
          };

          return {
            id: post.id,
            author,
            content: post.content || "",
            imageUrl: post.image_url,
            createdAt: new Date(post.created_at),
            updatedAt: post.updated_at ? new Date(post.updated_at) : undefined,
            likesCount: likesMap.get(post.id) || 0,
            commentsCount: commentsMap.get(post.id) || 0,
            isLiked: userLikes.includes(post.id),
          };
        }
      );

      setPosts(transformedPosts);
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (content: string, imageFile?: File) => {
    if (!user) {
      throw new Error("Vous devez être connecté pour créer un post");
    }

    let imageUrl: string | null = null;

    // Upload de l'image si fournie
    if (imageFile) {
      imageUrl = await uploadPostImage(imageFile, user.id);
    }

    // Créer le post dans Supabase
    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        content,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (error) throw error;

    // Recharger les posts
    await loadPosts();

    return data;
  };

  const updatePost = async (
    postId: string,
    content: string,
    imageFile?: File
  ) => {
    if (!user) {
      throw new Error("Vous devez être connecté pour modifier un post");
    }

    // Récupérer le post actuel pour obtenir l'image existante
    const { data: currentPost } = await supabase
      .from("posts")
      .select("image_url")
      .eq("id", postId)
      .single();

    let imageUrl: string | null = currentPost?.image_url || null;

    // Si une nouvelle image est fournie, uploader et supprimer l'ancienne
    if (imageFile) {
      // Supprimer l'ancienne image si elle existe
      if (imageUrl) {
        try {
          await deletePostImage(imageUrl);
        } catch (err) {
          // Ignore deletion errors
        }
      }
      // Uploader la nouvelle image
      imageUrl = await uploadPostImage(imageFile, user.id);
    }

    // Mettre à jour le post
    const { error } = await supabase
      .from("posts")
      .update({
        content,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (error) throw error;

    // Recharger les posts
    await loadPosts();
  };

  const deletePost = async (postId: string) => {
    if (!user) {
      throw new Error("Vous devez être connecté pour supprimer un post");
    }

    // Récupérer le post pour supprimer l'image associée
    const { data: post } = await supabase
      .from("posts")
      .select("image_url, user_id")
      .eq("id", postId)
      .single();

    // Supprimer l'image si elle existe
    if (post?.image_url) {
      try {
        await deletePostImage(post.image_url);
      } catch (err) {
        // Ignore deletion errors
      }
    }

    // Supprimer le post
    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) throw error;

    // Recharger les posts
    await loadPosts();
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      throw new Error("Vous devez être connecté pour aimer un post");
    }

    await togglePostLike(postId, user.id);
    // Recharger les posts pour mettre à jour les compteurs
    await loadPosts();
  };

  const incrementCommentCount = (postId: string) => {
    // Cette fonction est appelée après l'ajout d'un commentaire
    // On recharge les posts pour avoir les vrais compteurs
    loadPosts();
  };

  const decrementCommentCount = (postId: string) => {
    // Cette fonction est appelée après la suppression d'un commentaire
    // On recharge les posts pour avoir les vrais compteurs
    loadPosts();
  };

  // Filtrer les posts par recherche
  const filteredPosts = searchQuery.trim()
    ? posts.filter(
        (post) =>
          post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.author.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  // Créer l'objet currentUser à partir de l'utilisateur connecté
  const currentUser: PostAuthor =
    user && profile
      ? {
          id: user.id,
          name: profile.full_name,
          avatar:
            profile.profile_photo_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          isAdmin: profile.role === "admin",
        }
      : {
          id: "",
          name: "",
          avatar: "",
          isAdmin: false,
        };

  return {
    posts: filteredPosts,
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
  };
};
