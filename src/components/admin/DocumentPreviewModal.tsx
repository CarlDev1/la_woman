// /src/components/admin/DocumentPreviewModal.tsx

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentPath: string;
  bucketName: 'payment-proofs' | 'contracts';
  title: string;
  fileName: string;
}

const DocumentPreviewModal = ({
  open,
  onOpenChange,
  documentPath,
  bucketName,
  title,
  fileName
}: DocumentPreviewModalProps) => {
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && documentPath) {
      loadDocument();
    } else {
      setPreviewUrl(null);
      setLoading(true);
      setError(null);
    }
  }, [open, documentPath]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      // Télécharger le fichier depuis Supabase Storage
      const { data, error: downloadError } = await supabase.storage
        .from(bucketName)
        .download(documentPath);

      if (downloadError) throw downloadError;

      // Créer une URL blob pour la prévisualisation
      const url = URL.createObjectURL(data);
      setPreviewUrl(url);
    } catch (err: any) {
      console.error('Error loading document:', err);
      setError(err.message || 'Erreur lors du chargement du document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = fileName;
      link.click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
            <span className="ml-2">Chargement du document...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <X className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600 font-medium">Erreur</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
        )}

        {!loading && !error && previewUrl && (
          <>
            {/* Preview */}
            <div className="flex-1 overflow-auto border rounded-lg bg-gray-50">
              {documentPath.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[600px]"
                  title={title}
                />
              ) : (
                <img
                  src={previewUrl}
                  alt={title}
                  className="w-full h-auto object-contain"
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
              <Button onClick={handleDownload} className="bg-pink-500 hover:bg-pink-600">
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewModal;