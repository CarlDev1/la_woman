import { useState } from "react";
import { Comment, PostAuthor } from "./usePosts";

// Mock current user - TODO: Remplacer par le vrai user connecté
const CURRENT_USER: PostAuthor = {
  id: "user1",
  name: "Vous",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=You",
  isAdmin: false
};

const mockCommentsByPost: Record<string, Comment[]> = {
  "1": [
    {
      id: "c1",
      postId: "1",
      author: {
        id: "user3",
        name: "Clara Bernard",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Clara",
        isAdmin: false
      },
      content: "Super motivation ! Continue comme ça 💪",
      createdAt: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: "c2",
      postId: "1",
      author: {
        id: "admin1",
        name: "Julie Coach",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Julie",
        isAdmin: true
      },
      content: "Bravo pour cette première semaine ! Vous êtes sur la bonne voie 🎉",
      createdAt: new Date(Date.now() - 15 * 60 * 1000)
    }
  ]
};

export const useComments = (postId: string) => {
  const [comments, setComments] = useState<Comment[]>(mockCommentsByPost[postId] || []);

  const addComment = async (content: string) => {
    // TODO: Ajouter commentaire en DB
    const newComment: Comment = {
      id: `c${Date.now()}`,
      postId,
      author: CURRENT_USER,
      content,
      createdAt: new Date()
    };
    
    setComments([...comments, newComment]);
    return newComment;
  };

  const deleteComment = async (commentId: string) => {
    // TODO: Supprimer commentaire en DB
    setComments(comments.filter(c => c.id !== commentId));
  };

  const canDeleteComment = (comment: Comment, isAdmin: boolean = false) => {
    return comment.author.id === CURRENT_USER.id || isAdmin;
  };

  return {
    comments,
    currentUser: CURRENT_USER,
    addComment,
    deleteComment,
    canDeleteComment
  };
};
