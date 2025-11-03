import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Post } from '@/types/community';

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { content: string; imageFile?: File }) => Promise<void>;
  postToEdit?: Post | null;
}

export default function CreatePostModal({ 
  open, 
  onOpenChange, 
  onSubmit,
  postToEdit 
}: CreatePostModalProps) {
  const { toast } = useToast();
  const [content, setContent] = useState(postToEdit?.content || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(postToEdit?.image_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Format non supporté',
          description: 'Veuillez télécharger une image valide (JPEG, PNG, etc.)',
          variant: 'destructive',
        });
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: 'L\'image ne doit pas dépasser 5 Mo',
          variant: 'destructive',
        });
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    multiple: false,
  });

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    // If editing and there was a previous image, we need to handle that in the parent
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!content.trim() && !imageFile && !imagePreview) {
      toast({
        title: 'Contenu manquant',
        description: 'Veuillez ajouter du texte ou une image',
        variant: 'destructive',
      });
      return;
    }
    
    if (content.trim().length < 10 && !imageFile && !imagePreview) {
      toast({
        title: 'Texte trop court',
        description: 'Le texte doit contenir au moins 10 caractères',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      await onSubmit({
        content: content.trim(),
        imageFile: imageFile || undefined,
      });
      
      // Reset form on success
      setContent('');
      setImageFile(null);
      setImagePreview(null);
      onOpenChange(false);
      
      toast({
        title: postToEdit ? 'Publication mise à jour' : 'Publication créée',
        description: postToEdit 
          ? 'Votre publication a été mise à jour avec succès.'
          : 'Votre publication a été partagée avec la communauté.',
      });
    } catch (error) {
      console.error('Error submitting post:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la publication. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {postToEdit ? 'Modifier la publication' : 'Créer une publication'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <Textarea
              placeholder="Partagez quelque chose avec la communauté..."
              className="min-h-[120px] resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
            />
            
            {/* Image preview */}
            {imagePreview && (
              <div className="relative rounded-md overflow-hidden border">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-auto max-h-[400px] object-contain"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 hover:text-white"
                  onClick={removeImage}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Dropzone */}
            {!imagePreview && (
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
                  isSubmitting && 'opacity-50 pointer-events-none'
                )}
              >
                <input {...getInputProps()} disabled={isSubmitting} />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {isDragActive 
                        ? 'Déposez l\'image ici...' 
                        : 'Glissez-déposez une image ou cliquez pour sélectionner'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG, WEBP (max. 5 MB)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || (!content.trim() && !imagePreview)}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {postToEdit ? 'Mise à jour...' : 'Publication...'}
                </>
              ) : (
                postToEdit ? 'Mettre à jour' : 'Publier'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
