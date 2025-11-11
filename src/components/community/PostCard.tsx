import { useState } from "react";
import { Heart, MessageSquare, Share2, MoreVertical, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CommentSection from "./CommentSection";
import ImageModal from "./ImageModal";
import EditPostModal from "./EditPostModal";
import { toast } from "sonner";
import { Post } from "@/hooks/usePosts";

interface PostCardProps {
  post: Post;
  currentUserId: string;
  isCurrentUserAdmin?: boolean; // Nouveau prop pour vérifier si l'utilisateur actuel est admin
  onToggleLike: (postId: string) => void;
  onUpdate?: (postId: string, content: string, imageFile?: File) => void;
  onEdit?: (post: Post) => void; // Alternative pour l'édition via modal externe
  onDelete: (postId: string) => void;
  onCommentAdded: (postId: string) => void;
  onCommentDeleted: (postId: string) => void;
}

const PostCard = ({ 
  post, 
  currentUserId, 
  isCurrentUserAdmin = false,
  onToggleLike, 
  onUpdate,
  onEdit,
  onDelete,
  onCommentAdded,
  onCommentDeleted
}: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  
  const isOwnPost = post.author.id === currentUserId;
  // Admin peut supprimer tous les posts, utilisateur lambda seulement ses propres posts
  const canDelete = isCurrentUserAdmin || isOwnPost;
  // Utilisateur lambda peut seulement modifier ses propres posts, admin peut modifier tous les posts
  const canEdit = isCurrentUserAdmin || isOwnPost;
  const needsExpansion = post.content.length > 200;
  const displayContent = needsExpansion && !isExpanded 
    ? post.content.slice(0, 200) + "..." 
    : post.content;

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `Il y a ${diffInMinutes} min`;
    }
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 48) return "Hier";
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays} jours`;
  };

  const handleLike = () => {
    onToggleLike(post.id);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href + `/post/${post.id}`);
    toast.success("Lien copié dans le presse-papier");
  };

  const handleDelete = () => {
    onDelete(post.id);
    setShowDeleteDialog(false);
    toast.success("Post supprimé");
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow animate-fade-in">
        <CardHeader className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                <AvatarFallback>{post.author.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base">{post.author.name}</span>
                  {post.author.isAdmin && (
                    <Badge className="bg-primary text-primary-foreground text-xs uppercase">
                      Admin
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</span>
              </div>
            </div>
            
            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => {
                      if (onEdit) {
                        onEdit(post);
                      } else if (onUpdate) {
                        setShowEditModal(true);
                      }
                    }}>
                      <Edit className="w-4 h-4 mr-2" />
                      {isCurrentUserAdmin && !isOwnPost ? "Modifier (Admin)" : "Modifier"}
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isCurrentUserAdmin && !isOwnPost ? "Supprimer (Admin)" : "Supprimer"}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {post.imageUrl && (
            <div 
              className="w-full max-h-96 overflow-hidden cursor-pointer"
              onClick={() => setShowImageModal(true)}
            >
              <img 
                src={post.imageUrl} 
                alt="Post" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          
          <div className="p-4">
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {displayContent}
            </p>
            {needsExpansion && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary text-sm font-medium mt-2 hover:underline"
              >
                {isExpanded ? "Voir moins" : "Voir plus..."}
              </button>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={post.isLiked ? "text-red-500" : ""}
            >
              <Heart 
                className={`w-4 h-4 mr-1 ${post.isLiked ? "fill-current" : ""}`}
              />
              {post.likesCount}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              {post.commentsCount}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {showComments && (
            <CommentSection 
              postId={post.id}
              currentUserId={currentUserId}
              onCommentAdded={() => onCommentAdded(post.id)}
              onCommentDeleted={() => onCommentDeleted(post.id)}
            />
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isCurrentUserAdmin && !isOwnPost 
                ? "Supprimer ce post (Action Admin) ?" 
                : "Supprimer ce post ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isCurrentUserAdmin && !isOwnPost 
                ? "Vous êtes sur le point de supprimer le post d'un autre utilisateur en tant qu'administrateur. Cette action est irréversible."
                : "Cette action est irréversible. Le post sera définitivement supprimé."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {onUpdate && (
        <EditPostModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSubmit={(content, imageFile) => onUpdate(post.id, content, imageFile)}
          initialContent={post.content}
          initialImageUrl={post.imageUrl}
        />
      )}

      {post.imageUrl && (
        <ImageModal
          imageUrl={post.imageUrl}
          open={showImageModal}
          onOpenChange={setShowImageModal}
        />
      )}
    </>
  );
};

export default PostCard;
