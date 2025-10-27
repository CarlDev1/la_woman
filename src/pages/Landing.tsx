import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, Award } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,hsl(var(--secondary)/0.15),transparent_50%)]" />
        
        <div className="relative mx-auto max-w-5xl text-center">
          <h1 className="mb-6 text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
            <span className="gradient-text">LA WOMAN</span>
          </h1>
          <p className="mb-4 text-2xl font-semibold text-foreground/90 sm:text-3xl">
            Révélez la femme d'affaires qui est en vous
          </p>
          <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
            Suivez vos performances, atteignez vos objectifs et célébrez vos victoires
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200">
              <Link to="/login">Se connecter</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200">
              <Link to="/register">S'inscrire gratuitement</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-2xl bg-card p-8 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Suivez vos performances</h3>
              <p className="text-muted-foreground">
                Enregistrez votre chiffre d'affaires et bénéfices quotidiennement. Visualisez votre évolution avec des graphiques clairs et motivants.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl bg-card p-8 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Trophy className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Débloquez des trophées</h3>
              <p className="text-muted-foreground">
                Atteignez des objectifs ambitieux et obtenez automatiquement des trophées prestigieux : Bronze, Argent, Or, Diamant...
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl bg-card p-8 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Award className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Classez-vous parmi les meilleures</h3>
              <p className="text-muted-foreground">
                Comparez vos performances avec d'autres entrepreneures et visez le top du classement mensuel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-r from-primary to-primary-hover p-12 text-center shadow-2xl">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground sm:text-4xl">
            Prête à transformer votre business ?
          </h2>
          <p className="mb-8 text-lg text-primary-foreground/90">
            Rejoignez LA WOMAN aujourd'hui et commencez votre parcours vers le succès
          </p>
          <Button asChild size="lg" variant="secondary" className="shadow-lg hover:shadow-xl">
            <Link to="/register">Créer mon compte maintenant</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 LA WOMAN. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
