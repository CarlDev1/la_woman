import { useState } from "react";
import { Trash2, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    isAdmin: boolean;
  };
  content: string;
  createdAt: Date;
}

interface CommentSectionProps {
  postId: string;
  currentUserId: string;
}

// Mock comments
const mockComments: Comment[] = [
  {
    id: "1",
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
    id: "2",
    author: {
      id: "admin1",
      name: "Julie Coach",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Julie",
      isAdmin: true
    },
    content: "Bravo pour cette première semaine ! Vous êtes sur la bonne voie 🎉",
    createdAt: new Date(Date.now() - 15 * 60 * 1000)
  }
];

const CommentSection = ({ postId, currentUserId }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState("");
  const [showAll, setShowAll] = useState(false);
  
  const displayedComments = showAll ? comments : comments.slice(0, 5);
  const hasMore = comments.length > 5;

  const formatCommentDate = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    return "Il y a plus d'un jour";
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    if (newComment.length > 300) {
      toast.error("Le commentaire ne peut pas dépasser 300 caractères");
      return;
    }

    // TODO: Ajouter le commentaire à la DB
    const comment: Comment = {
      id: Date.now().toString(),
      author: {
        id: currentUserId,
        name: "Vous", // TODO: Récupérer le vrai nom
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=You",
        isAdmin: false
      },
      content: newComment,
      createdAt: new Date()
    };
    
    setComments([...comments, comment]);
    setNewComment("");
    toast.success("Commentaire publié");
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter(c => c.id !== commentId));
    toast.success("Commentaire supprimé");
  };

  const canDeleteComment = (comment: Comment) => {
    return comment.author.id === currentUserId; // TODO: || isAdmin
  };

  return (
    <div className="w-full space-y-4">
      <Separator />
      
      {/* Input nouveau commentaire */}
      <div className="flex gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=You" />
          <AvatarFallback>V</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="resize-none min-h-[60px]"
            maxLength={300}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {newComment.length}/300
            </span>
            <Button 
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              size="sm"
            >
              Publier
            </Button>
          </div>
        </div>
      </div>

      {/* Liste des commentaires */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p className="text-sm">💬 Aucun commentaire pour le moment</p>
          <p className="text-xs">Soyez la première à réagir !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedComments.map((comment) => (
            <div key={comment.id} className="flex gap-3 animate-slide-in-right">
              <Avatar className="w-8 h-8">
                <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{comment.author.name}</span>
                    {comment.author.isAdmin && (
                      <Badge className="bg-primary text-primary-foreground text-xs uppercase">
                        Admin
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatCommentDate(comment.createdAt)}
                    </span>
                  </div>
                  
                  {canDeleteComment(comment) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
          
          {hasMore && !showAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(true)}
              className="w-full"
            >
              Voir plus de commentaires ({comments.length - 5} autres)
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
