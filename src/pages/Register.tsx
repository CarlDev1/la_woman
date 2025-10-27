import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Upload, X } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [contract, setContract] = useState<File | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La photo ne doit pas dépasser 2 MB');
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Format accepté : JPG ou PNG uniquement');
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

    // Validation
    if (fullName.length < 3) {
      toast.error('Le nom doit contenir au moins 3 caractères');
      return;
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (bio.length < 20) {
      toast.error('La présentation doit contenir au moins 20 caractères');
      return;
    }

    if (!avatar || !paymentProof || !contract) {
      toast.error('Tous les fichiers sont obligatoires');
      return;
    }

    setLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erreur lors de la création du compte');

      const userId = authData.user.id;

      // 2. Upload avatar
      const avatarExt = avatar.name.split('.').pop();
      const avatarPath = `${userId}/avatar.${avatarExt}`;
      const { error: avatarError } = await supabase.storage
        .from('avatars')
        .upload(avatarPath, avatar, { upsert: true });

      if (avatarError) throw avatarError;

      const { data: { publicUrl: avatarUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(avatarPath);

      // 3. Upload payment proof
      const proofExt = paymentProof.name.split('.').pop();
      const proofPath = `${userId}/payment_proof.${proofExt}`;
      const { error: proofError } = await supabase.storage
        .from('payment-proofs')
        .upload(proofPath, paymentProof, { upsert: true });

      if (proofError) throw proofError;

      const { data: { publicUrl: proofUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(proofPath);

      // 4. Upload contract
      const contractExt = contract.name.split('.').pop();
      const contractPath = `${userId}/contract.${contractExt}`;
      const { error: contractError } = await supabase.storage
        .from('contracts')
        .upload(contractPath, contract, { upsert: true });

      if (contractError) throw contractError;

      const { data: { publicUrl: contractUrl } } = supabase.storage
        .from('contracts')
        .getPublicUrl(contractPath);

      // 5. Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        full_name: fullName,
        phone,
        bio,
        avatar_url: avatarUrl,
        payment_proof_url: proofUrl,
        contract_url: contractUrl,
        role: 'user',
        status: 'pending',
      });

      if (profileError) throw profileError;

      toast.success('✅ Votre inscription a été envoyée ! Vous recevrez un email dès validation.');
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 px-4 py-12">
      <Card className="mx-auto w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold gradient-text">Rejoindre LA WOMAN</CardTitle>
          <CardDescription>Créez votre compte en quelques étapes</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Votre nom complet"
                required
                minLength={3}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
              />
            </div>

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

            {/* Passwords */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Présentation de votre activité * (min 20 caractères)</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Décrivez votre activité professionnelle..."
                rows={4}
                required
                minLength={20}
              />
              <p className="text-xs text-muted-foreground">{bio.length} caractères</p>
            </div>

            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label htmlFor="avatar">Photo de profil * (JPG/PNG, max 2MB)</Label>
              {avatarPreview && (
                <div className="relative inline-block">
                  <img src={avatarPreview} alt="Preview" className="h-24 w-24 rounded-full object-cover" />
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
              <Label htmlFor="paymentProof">Preuve de paiement * (PDF/JPG/PNG, max 5MB)</Label>
              <Input
                id="paymentProof"
                type="file"
                accept=".pdf,image/jpeg,image/png"
                onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                required
              />
              {paymentProof && (
                <p className="text-sm text-muted-foreground">✓ {paymentProof.name}</p>
              )}
            </div>

            {/* Contract */}
            <div className="space-y-2">
              <Label htmlFor="contract">Contrat de travail signé * (PDF, max 5MB)</Label>
              <Input
                id="contract"
                type="file"
                accept=".pdf"
                onChange={(e) => setContract(e.target.files?.[0] || null)}
                required
              />
              {contract && (
                <p className="text-sm text-muted-foreground">✓ {contract.name}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full bg-primary hover:bg-primary-hover" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                'S\'inscrire'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà inscrite ?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
