import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔐 Tentative de connexion avec:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erreur auth:', error);
        throw error;
      }

      console.log('✅ Auth réussie, user ID:', data.user?.id);

      if (data.user) {
        // Fetch profile to check status
        console.log('📋 Récupération du profil...');
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        console.log('📊 Profil récupéré:', profile);
        console.log('⚠️ Erreur profil:', profileError);

        if (profileError) {
          console.error('❌ Erreur lors de la récupération du profil:', profileError);
          
          // Si le profil n'existe pas, le créer
          if (profileError.code === 'PGRST116') {
            toast.error('Profil introuvable. Veuillez contacter l\'administrateur.');
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }
          
          throw profileError;
        }

        if (!profile) {
          toast.error('Profil introuvable. Veuillez contacter l\'administrateur.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        console.log('👤 Profil:', profile);
        console.log('🔒 Statut:', profile.status);
        console.log('👑 Rôle:', profile.role);

        if (profile.status === 'pending') {
          await supabase.auth.signOut();
          toast.warning('⏳ Votre compte est en attente de validation par l\'administrateur');
          setLoading(false);
          return;
        }

        if (profile.status === 'inactive') {
          await supabase.auth.signOut();
          toast.error('❌ Votre compte a été refusé ou désactivé. Contactez l\'administration.');
          setLoading(false);
          return;
        }

        // Active account - redirect based on role
        if (profile.role === 'admin') {
          console.log('✅ Redirection vers admin dashboard');
          toast.success(`Bienvenue ${profile.full_name} 👑`);
          navigate('/admin/dashboard');
        } else if (profile.role === 'user' && profile.status === 'active') {
          console.log('✅ Redirection vers user dashboard');
          toast.success(`Bienvenue ${profile.full_name} 👋`);
          navigate('/dashboard');
        } else {
          console.error('❌ Combinaison role/status invalide:', profile);
          toast.error('Accès non autorisé');
          await supabase.auth.signOut();
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur générale:', error);
      toast.error(error.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/30 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold gradient-text">LA WOMAN</CardTitle>
          <CardDescription>Connectez-vous à votre espace</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary-hover" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-4 text-center text-sm">
            <Link to="/forgot-password" className="text-primary hover:underline">
              Mot de passe oublié ?
            </Link>
            <p className="text-muted-foreground">
              Pas encore inscrite ?{' '}
              <Link to="/register" className="font-medium text-primary hover:underline">
                S'inscrire
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
