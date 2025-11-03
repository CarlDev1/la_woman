import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Trophy,
  PlusCircle,
  ScrollText,
  Award,
  User,
  LogOut,
  Shield,
  Users,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const navItems = [
  { name: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Communauté', path: '/community', icon: MessageSquare },
  { name: 'Mes trophées', path: '/trophies', icon: Trophy },
  { name: 'Nouvelle saisie', path: '/new-entry', icon: PlusCircle },
  { name: 'Historique', path: '/history', icon: ScrollText },
  { name: 'Classement', path: '/leaderboard', icon: Award },
  { name: 'Mon profil', path: '/profile', icon: User },
];

const mobileNavItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Communauté', path: '/community', icon: MessageSquare },
  { name: 'Saisir', path: '/new-entry', icon: PlusCircle, isCenter: true },
  { name: 'Trophées', path: '/trophies', icon: Trophy },
  { name: 'Profil', path: '/profile', icon: User },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl font-bold gradient-text">LA WOMAN</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {isAdmin ? 'Administratrice' : 'Participante'}
                </p>
                {isAdmin && (
                  <Badge variant="default" className="h-5 text-xs">
                    Admin
                  </Badge>
                )}
              </div>
            </div>
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {profile?.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden h-[calc(100vh-4rem)] w-64 border-r border-border bg-white md:block">
          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'border-l-4 border-primary bg-primary/5 text-primary'
                      : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
            
            {isAdmin && (
              <>
                <div className="my-2 border-t border-border" />
                <Link
                  to="/admin"
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive('/admin')
                      ? 'border-l-4 border-primary bg-primary/5 text-primary'
                      : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
                  )}
                >
                  <Shield className="h-5 w-5" />
                  Administration
                </Link>
                <Link
                  to="/admin/participants"
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive('/admin/participants')
                      ? 'border-l-4 border-primary bg-primary/5 text-primary'
                      : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
                  )}
                >
                  <Users className="h-5 w-5" />
                  Participantes
                </Link>
                <Link
                  to="/admin/trophies"
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive('/admin/trophies')
                      ? 'border-l-4 border-primary bg-primary/5 text-primary'
                      : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
                  )}
                >
                  <Trophy className="h-5 w-5" />
                  Trophées
                </Link>
              </>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-8">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white shadow-lg md:hidden">
        <div className="grid h-16 grid-cols-5 items-center">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            if (item.isCenter) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <Icon className="h-6 w-6" />
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
