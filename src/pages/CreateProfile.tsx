import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  sendNewRegistrationEmail,
  sendWelcomeEmail,
} from "@/lib/email-service";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Loader2, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const CreateProfile = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const [phone, setPhone] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [contract, setContract] = useState<File | null>(null);

  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (session?.user) {
          setUser(session.user);
        } else {
          toast.error("Vous devez être connecté pour créer un profil.");
          navigate("/login");
        }
      } catch (error) {
        console.error("Erreur de session:", error);
        toast.error("Erreur lors de la récupération de votre session.");
        navigate("/login");
      } finally {
        setPageLoading(false);
      }
    };

    fetchUserSession();
  }, [navigate]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("La photo ne doit pas dépasser 2 MB");
        return;
      }
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast.error("Format accepté : JPG ou PNG uniquement");
        return;
      }
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error(
        "Session utilisateur non trouvée. Veuillez vous reconnecter."
      );
      navigate("/login");
      return;
    }

    if (activityDescription.length < 20) {
      toast.error("La présentation doit contenir au moins 20 caractères");
      return;
    }
    if (!avatar || !paymentProof || !contract) {
      toast.error("Tous les fichiers sont obligatoires");
      return;
    }

    setIsSubmitting(true);

    try {
      // On récupère l'ID, l'email et le nom de l'objet 'user'
      const userId = user.id;
      const userEmail = user.email!;
      const userFullName = user.user_metadata.full_name;

      // 2. Upload profile photo (Bucket public, getPublicUrl est OK)
      const avatarExt = avatar.name.split(".").pop();
      const avatarPath = `${userId}/profile_photo.${avatarExt}`;
      const { error: avatarError } = await supabase.storage
        .from("profile-photos")
        .upload(avatarPath, avatar, { upsert: true });

      if (avatarError) throw avatarError;

      const {
        data: { publicUrl: avatarUrl },
      } = supabase.storage.from("profile-photos").getPublicUrl(avatarPath);

      // 3. Upload payment proof (Bucket privé)
      const proofExt = paymentProof.name.split(".").pop();
      const proofPath = `${userId}/payment_proof.${proofExt}`;
      const { error: proofError } = await supabase.storage
        .from("payment-proofs")
        .upload(proofPath, paymentProof, { upsert: true });

      if (proofError) throw proofError;

      const proofUrl = proofPath;

      const contractExt = contract.name.split(".").pop();
      const contractPath = `${userId}/contract.${contractExt}`;
      const { error: contractError } = await supabase.storage
        .from("contracts")
        .upload(contractPath, contract, { upsert: true });

      if (contractError) throw contractError;

      const contractUrl = contractPath;

      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        email: userEmail,
        full_name: userFullName,
        phone: phone,
        activity_description: activityDescription,
        profile_photo_url: avatarUrl,
        payment_proof_url: proofUrl,
        contract_url: contractUrl,
        role: "user",
        status: "pending",
      });

      if (profileError) throw profileError;

      let emailsSent = 0;
      const emailErrors: string[] = [];

      // 1️⃣ Email à l'utilisateur (confirmation d'inscription)
      try {
        const confirmationUrl = `${window.location.origin}/profile/pending`;
        await sendWelcomeEmail(userEmail, userFullName, confirmationUrl);
        emailsSent++;
      } catch (error) {
        console.error("❌ Welcome email error:", error);
        emailErrors.push("utilisateur");
      }

      // 2️⃣ Email à l'admin (notification nouvelle inscription)
      try {
        const ADMIN_EMAIL = "carlosdjanato1@gmail.com";

        await sendNewRegistrationEmail(
          ADMIN_EMAIL,
          userFullName,
          userEmail,
          phone
        );
        emailsSent++;
      } catch (error) {
        emailErrors.push("admin");
      }

      // Afficher les résultats
      if (emailsSent === 2) {
        toast.success(
          "Profil complété ! Vérifiez votre email pour confirmer votre inscription."
        );
      } else if (emailsSent === 1) {
        toast.success(
          "Profil complété ! ⚠ Un des emails n'a pas pu être envoyé."
        );
      } else {
        toast.warning(
          "Profil créé mais les emails n'ont pas pu être envoyés. Contactez l'admin."
        );
      }

      navigate("/login");
    } catch (error) {
      console.error("Profile creation error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la création du profil"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 px-4 py-12">
      <Card className="mx-auto w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold gradient-text">
            Compléter votre profil
          </CardTitle>
          <CardDescription>Étape 2/2 : Parlez-nous de vous</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+225 XX XX XX XX XX"
                required
              />
            </div>

            {/* Activity Description */}
            <div className="space-y-2">
              <Label htmlFor="activityDescription">
                Présentation de votre activité * (min 20 caractères)
              </Label>
              <Textarea
                id="activityDescription"
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                placeholder="Décrivez votre activité professionnelle..."
                rows={4}
                required
                minLength={20}
              />
              <p className="text-xs text-muted-foreground">
                {activityDescription.length} caractères
              </p>
            </div>

            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label htmlFor="avatar">
                Photo de profil * (JPG/PNG, max 2MB)
              </Label>
              {avatarPreview && (
                <div className="relative inline-block">
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAvatar(null);
                      setAvatarPreview(null);
                    }}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {!avatarPreview && (
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" asChild>
                    <label htmlFor="avatar" className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Choisir une photo
                    </label>
                  </Button>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleAvatarChange}
                    className="hidden"
                    required
                  />
                </div>
              )}
            </div>

            {/* Payment Proof */}
            <div className="space-y-2">
              <Label htmlFor="paymentProof">
                Preuve de paiement * (PDF/JPG/PNG, max 5MB)
              </Label>
              <Input
                id="paymentProof"
                type="file"
                accept=".pdf,image/jpeg,image/png"
                onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                required
              />
              {paymentProof && (
                <p className="text-sm text-muted-foreground">
                  ✓ {paymentProof.name}
                </p>
              )}
            </div>

            {/* Contract */}
            <div className="space-y-2">
              <Label htmlFor="contract">
                Contrat de travail signé * (PDF, max 5MB)
              </Label>
              <Input
                id="contract"
                type="file"
                accept=".pdf"
                onChange={(e) => setContract(e.target.files?.[0] || null)}
                required
              />
              {contract && (
                <p className="text-sm text-muted-foreground">
                  ✓ {contract.name}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-hover"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                "Terminer l'inscription (Étape 2/2)"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateProfile;
