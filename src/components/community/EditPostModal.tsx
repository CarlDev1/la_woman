import { useState, useRef, useEffect } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface EditPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (content: string, imageFile?: File) => void;
  initialContent: string;
  initialImageUrl: string | null;
}

const EditPostModal = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  initialContent,
  initialImageUrl 
}: EditPostModalProps) => {
  const [content, setContent] = useState(initialContent);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setContent(initialContent);
      setImagePreview(initialImageUrl);
      setImageFile(null);
      setRemoveExistingImage(false);
    }
  }, [open, initialContent, initialImageUrl]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image (JPG ou PNG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB");
      return;
    }

    setImageFile(file);
    setRemoveExistingImage(false);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!imagePreview && content.trim().length < 10) {
      toast.error("Veuillez ajouter une image ou au moins 10 caractères de texte");
      return;
    }

    if (content.length > 500) {
      toast.error("Le texte ne peut pas dépasser 500 caractères");
      return;
    }

    setIsUploading(true);
    
    try {
      await onSubmit(content, imageFile || undefined);
      toast.success("✅ Post modifié avec succès !");
      onOpenChange(false);
    } catch (error) {
      toast.error("Erreur lors de la modification");
    } finally {
      setIsUploading(false);
    }
  };

  const isFormValid = imagePreview || content.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Image Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleImageSelect}
              className="hidden"
              id="edit-image-upload"
            />
            
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full max-h-96 object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="edit-image-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-12 h-12 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Cliquez pour sélectionner</span> ou glissez une image
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG ou PNG (max 5MB)
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* Text Content */}
          <div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Partagez vos réussites, conseils, ou posez vos questions..."
              className="min-h-[120px] resize-none"
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">
                {!imagePreview && content.trim().length < 10 && (
                  <span className="text-destructive">
                    Minimum 10 caractères ou une image requis
                  </span>
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {content.length}/500
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isUploading}
          >
            {isUploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Modification...
              </>
            ) : (
              "Modifier"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPostModal;
