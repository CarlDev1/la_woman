import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Calendar, Eye, Check, X } from 'lucide-react';
import { Profile } from '@/lib/supabase';
import { useState } from 'react';
import DocumentPreviewModal from './DocumentPreviewModal';

interface ParticipantCardProps {
  participant: Profile;
  onValidate: (userId: string, email: string, name: string) => void;
  onReject: (userId: string, email: string, name: string) => void;
}

const ParticipantCard = ({ participant, onValidate, onReject }: ParticipantCardProps) => {
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{
    path: string;
    bucket: 'payment-proofs' | 'contracts';
    title: string;
    fileName: string;
  } | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleViewPaymentProof = () => {
    if (!participant.payment_proof_url) return;

    setPreviewDocument({
      path: participant.payment_proof_url,
      bucket: 'payment-proofs',
      title: 'Preuve de paiement',
      fileName: `preuve_paiement_${participant.full_name.replace(/\s+/g, '_')}.pdf`
    });
    setPreviewModalOpen(true);
  };

  const handleViewContract = () => {
    if (!participant.contract_url) return;

    setPreviewDocument({
      path: participant.contract_url,
      bucket: 'contracts',
      title: 'Contrat de travail',
      fileName: `contrat_${participant.full_name.replace(/\s+/g, '_')}.pdf`
    });
    setPreviewModalOpen(true);
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header with photo and name */}
            <div className="flex items-start gap-4">
              {participant.profile_photo_url ? (
                <img
                  src={participant.profile_photo_url}
                  alt={participant.full_name}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-pink-100 flex items-center justify-center">
                  <span className="text-pink-600 text-xl font-bold">
                    {participant.full_name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">
                  {participant.full_name}
                </h3>
                <Badge variant="secondary" className="mt-1">
                  En attente
                </Badge>
              </div>
            </div>

            {/* Contact info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span className="truncate">{participant.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{participant.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Inscrite le {formatDate(participant.created_at)}</span>
              </div>
            </div>

            {/* Activity description */}
            {participant.activity_description && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Présentation de l'activité :
                </p>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {participant.activity_description}
                </p>
              </div>
            )}

            {/* Preview buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewPaymentProof}
                disabled={!participant.payment_proof_url}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Voir preuve de paiement
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewContract}
                disabled={!participant.contract_url}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Voir contrat
              </Button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => onValidate(participant.id, participant.email, participant.full_name)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Check className="h-4 w-4 mr-2" />
                Valider
              </Button>
              <Button
                onClick={() => onReject(participant.id, participant.email, participant.full_name)}
                variant="destructive"
                className="flex-1"
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Refuser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {previewDocument && (
        <DocumentPreviewModal
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          documentPath={previewDocument.path}
          bucketName={previewDocument.bucket}
          title={previewDocument.title}
          fileName={previewDocument.fileName}
        />
      )}
    </>
  );
};

export default ParticipantCard;